import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()

    // Use public view instead of schema switching
    const { count, error } = await supabase
      .from('sales_v2')
      .select('*', { count: 'exact' })
      .limit(0)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, salesCount: count ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}

