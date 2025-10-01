import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'
import { SEED_DATA } from '@/lib/admin/seedDataset'

function authOk(req: NextRequest): boolean {
  const token = process.env.SEED_TOKEN
  if (!token) return false
  const hdr = req.headers.get('authorization') || ''
  const m = /^Bearer\s+(.+)$/i.exec(hdr)
  if (!m) return false
  return m[1] === token
}

export async function POST(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseServerClient()
  let inserted = 0
  let skipped = 0
  let itemsInserted = 0
  const errors: Array<{ title: string; message: string }> = []

  for (const seed of SEED_DATA) {
    try {
      // Build dedupe key conditions based on: seller_id, lower(title), starts_at::date, rounded lat/lng
      const startDate = seed.starts_at.split('T')[0]
      const { data: existing, error: existErr } = await supabase
        .from(T.sales)
        .select('id')
        .eq('owner_id', seed.seller_id)
        .ilike('title', seed.title)
        .eq('date_start', startDate)
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

      const { data: created, error: insErr } = await supabase
        .from(T.sales)
        .insert({
          owner_id: seed.seller_id,
          title: seed.title,
          description: null,
          city: seed.city,
          state: seed.state,
          lat: seed.lat,
          lng: seed.lng,
          date_start: startDate,
          time_start: seed.starts_at.split('T')[1]?.slice(0,5) || '08:00',
          price: 0,
          is_featured: false,
          status: 'published',
          tags: seed.categories || [],
        })
        .select('id')
        .single()

      if (insErr || !created) {
        throw insErr || new Error('Insert failed')
      }

      inserted += 1

      // Insert 2–3 items per sale
      for (const item of seed.items.slice(0, 3)) {
        const { error: itemErr } = await supabase
          .from(T.items)
          .insert({
            sale_id: created.id,
            name: item.name,
            description: null,
            // Convert dollars to integer price if the schema expects numbers; using dollars here
            price: Math.round(item.price),
            category: null,
            condition: null,
            images: [],
          })
        if (!itemErr) itemsInserted += 1
      }
    } catch (e: any) {
      errors.push({ title: seed.title, message: String(e?.message || e) })
    }
  }

  return NextResponse.json({ ok: true, inserted, skipped, itemsInserted, errors: errors.length ? errors : undefined })
}


