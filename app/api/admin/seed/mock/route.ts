import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'
import { SEED_DATA } from '@/lib/admin/seedDataset'
import { RateLimiter } from '@/lib/rateLimiter'
import { checkAndSetIdempotency } from '@/lib/admin/idempotency'

function authOk(req: NextRequest): boolean {
  const token = process.env.SEED_TOKEN
  if (!token) return false
  const hdr = req.headers.get('authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(hdr)
  if (!m) return false
  return m[1] === token
}

function validateSeedSale(seed: any): string[] {
  const errors: string[] = []
  if (!seed.seller_id) errors.push('seller_id is required')
  if (!seed.title) errors.push('title is required')
  if (!seed.starts_at) errors.push('starts_at is required')
  if (typeof seed.lat !== 'number' || isNaN(seed.lat)) errors.push('latitude must be a valid number')
  if (typeof seed.lng !== 'number' || isNaN(seed.lng)) errors.push('longitude must be a valid number')
  return errors
}

function parseDateTime(isoString: string): { date: string; time: string } {
  const [date, time] = isoString.split('T')
  return { date, time: time?.slice(0, 5) || '08:00' }
}

function addHours(isoString: string, hours: number): string {
  const date = new Date(isoString)
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit: 5/min per IP
  const limiter = new RateLimiter({ windowMs: 60 * 1000, maxRequests: 5 })
  const rate = await limiter.checkLimit(req as any)
  if (!rate.success) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 })
  }

  // Idempotency: 24h replay protection
  const idKey = req.headers.get('Idempotency-Key') || req.headers.get('idempotency-key')
  const idStatus = checkAndSetIdempotency(idKey)
  if (idStatus === 'replay') {
    return NextResponse.json({ ok: true, status: 'idempotent_replay' })
  }

  const supabase = createSupabaseServerClient()
  let inserted = 0
  let skipped = 0
  let itemsInserted = 0
  const errors: Array<{ title: string; message: string }> = []

  for (const seed of SEED_DATA) {
    try {
      // Validate required fields
      const validationErrors = validateSeedSale(seed)
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`)
      }

      // Parse starts_at and calculate ends_at if not provided
      const startDateTime = parseDateTime(seed.starts_at)
      const endDateTime = seed.ends_at ? parseDateTime(seed.ends_at) : parseDateTime(addHours(seed.starts_at, 4))

          // Dedupe: SELECT existing by key (seller_id, lower(title), date(starts_at), ROUND(latitude,4), ROUND(longitude,4))
          const { data: existing, error: existErr } = await supabase
            .from('sales_v2')
            .select('id')
            .eq('owner_id', seed.seller_id)
            .ilike('title', seed.title.toLowerCase())
            .eq('date_start', startDateTime.date)
            .gte('lat', Number((seed.lat - 0.00005).toFixed(4)))
            .lte('lat', Number((seed.lat + 0.00005).toFixed(4)))
            .gte('lng', Number((seed.lng - 0.00005).toFixed(4)))
            .lte('lng', Number((seed.lng + 0.00005).toFixed(4)))
            .limit(1)
            .maybeSingle()

      if (existErr) {
        throw existErr
      }

      if (existing) {
        skipped += 1
        continue
      }

          // Insert sale (this will need to be done via direct table access since views are read-only)
          // For now, we'll need to use the original table reference
          const { data: created, error: insErr } = await supabase
            .from('lootaura_v2.sales')
            .insert({
              owner_id: seed.seller_id,
              title: seed.title,
              description: null,
              address: seed.address || null,
              city: seed.city,
              state: seed.state,
              zip_code: null,
              lat: seed.lat,
              lng: seed.lng,
              date_start: startDateTime.date,
              time_start: startDateTime.time,
              date_end: endDateTime.date,
              time_end: endDateTime.time,
              status: 'published',
              privacy_mode: 'exact',
              is_featured: false,
            })
            .select('id')
            .single()

      if (insErr || !created) {
        throw insErr || new Error('Sale insert failed')
      }

      inserted += 1

          // Insert items with sale_id and price_cents (Math.round(price*100))
          for (const item of seed.items) {
            const { error: itemErr } = await supabase
              .from('lootaura_v2.items')
              .insert({
                sale_id: created.id,
                name: item.name,
                description: null,
                price: Math.round(item.price * 100), // Convert to cents
                category: null,
                condition: null,
                images: [],
                is_sold: false,
              })
            if (!itemErr) itemsInserted += 1
          }
    } catch (e: any) {
      errors.push({ title: seed.title, message: String(e?.message || e) })
    }
  }

  return NextResponse.json({ 
    ok: errors.length === 0, 
    inserted, 
    skipped, 
    itemsInserted, 
    errors: errors.length ? errors : undefined 
  })
}


