import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'
import { MOCK_SALES } from '@/lib/admin/mockSeed'

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

  for (const sale of MOCK_SALES) {
    try {
      // Build dedupe key conditions
      const { data: existing, error: existErr } = await supabase
        .from(T.sales)
        .select('id')
        .eq('owner_id', sale.seller_id)
        .ilike('title', sale.title)
        .eq('date_start', sale.date_start)
        .gte('lat', Number((sale.lat - 0.00005).toFixed(4)))
        .lte('lat', Number((sale.lat + 0.00005).toFixed(4)))
        .gte('lng', Number((sale.lng - 0.00005).toFixed(4)))
        .lte('lng', Number((sale.lng + 0.00005).toFixed(4)))
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
          owner_id: sale.seller_id,
          title: sale.title,
          description: sale.description || null,
          city: sale.city,
          state: sale.state,
          lat: sale.lat,
          lng: sale.lng,
          date_start: sale.date_start,
          time_start: sale.time_start,
          price: sale.price ?? 0,
          is_featured: !!sale.is_featured,
          status: 'published',
          tags: sale.tags || [],
        })
        .select('id')
        .single()

      if (insErr || !created) {
        throw insErr || new Error('Insert failed')
      }

      inserted += 1

      // Insert 2–3 items per sale
      for (const item of sale.items.slice(0, 3)) {
        const { error: itemErr } = await supabase
          .from(T.items)
          .insert({
            sale_id: created.id,
            name: item.name,
            description: item.description || null,
            price: item.price_cents ? Math.round(item.price_cents / 100) : null,
            category: item.category || null,
            condition: item.condition || null,
            images: item.images || [],
          })
        if (!itemErr) itemsInserted += 1
      }
    } catch (e: any) {
      errors.push({ title: sale.title, message: String(e?.message || e) })
    }
  }

  return NextResponse.json({ ok: true, inserted, skipped, itemsInserted, errors: errors.length ? errors : undefined })
}


