import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getWeekendWindow, getNextWeekendWindow } from '@/lib/date/dateWindows'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()

    // Totals using public views (RLS respected)
    const [salesCountRes, itemsCountRes, favsCountRes, zipsCountRes] = await Promise.all([
      supabase.from('sales_v2').select('*', { count: 'exact' }).limit(0),
      supabase.from('items_v2').select('*', { count: 'exact' }).limit(0),
      supabase.from('favorites_v2').select('*', { count: 'exact' }).limit(0),
      supabase.from('zipcodes_v2').select('*', { count: 'exact' }).limit(0),
    ])

    if (salesCountRes.error || itemsCountRes.error || favsCountRes.error || zipsCountRes.error) {
      const e = salesCountRes.error || itemsCountRes.error || favsCountRes.error || zipsCountRes.error
      throw new Error(e!.message)
    }

    const sales = salesCountRes.count ?? 0
    const items = itemsCountRes.count ?? 0
    const favorites = favsCountRes.count ?? 0
    const zipcodes = zipsCountRes.count ?? 0

    // Categories (approximate by scanning up to 5000 rows under RLS)
    const { data: tagRows, error: tagErr } = await supabase
      .from('sales_v2')
      .select('tags')
      .limit(5000)

    if (tagErr) throw new Error(tagErr.message)

    const tagCounts = new Map<string, number>()
    for (const row of tagRows || []) {
      const arr: string[] = Array.isArray(row?.tags) ? row.tags : []
      for (const t of arr) {
        const key = String(t).trim().toLowerCase()
        if (!key) continue
        tagCounts.set(key, (tagCounts.get(key) || 0) + 1)
      }
    }
    const top10 = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
    const uniqueCount = tagCounts.size

    // Dates
    const [{ data: minRow }, { data: maxRow }] = await Promise.all([
      supabase.from('sales_v2').select('date_start').not('date_start', 'is', null).order('date_start', { ascending: true }).limit(1).maybeSingle(),
      supabase.from('sales_v2').select('date_start').not('date_start', 'is', null).order('date_start', { ascending: false }).limit(1).maybeSingle(),
    ])

    const weekend = getWeekendWindow()
    const nextWeekend = getNextWeekendWindow()

    const [{ count: thisWeekendCount }, { count: nextWeekendCount }] = await Promise.all([
      supabase.from('sales_v2')
        .select('*', { count: 'exact' })
        .gte('date_start', weekend.start.toISOString().slice(0, 10))
        .lte('date_start', weekend.end.toISOString().slice(0, 10))
        .limit(0),
      supabase.from('sales_v2')
        .select('*', { count: 'exact' })
        .gte('date_start', nextWeekend.start.toISOString().slice(0, 10))
        .lte('date_start', nextWeekend.end.toISOString().slice(0, 10))
        .limit(0),
    ])

    return NextResponse.json({
      ok: true,
      totals: { sales, items, favorites, zipcodes },
      categories: { top10, uniqueCount },
      dates: {
        minStartsAt: minRow?.date_start ?? null,
        maxStartsAt: maxRow?.date_start ?? null,
        thisWeekendCount: thisWeekendCount ?? 0,
        nextWeekendCount: nextWeekendCount ?? 0,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'unknown' }, { status: 500 })
  }
}


