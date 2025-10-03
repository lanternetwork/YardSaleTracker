import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSchema } from '@/lib/supabase/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const schema = getSchema()

    const { count, error } = await (supabase as any)
      .schema(schema)
      .from('sales')
      .select('*', { count: 'exact' })
      .limit(0)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, schema }, { status: 500 })
    }

    return NextResponse.json({ ok: true, schema, salesCount: count ?? 0 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}

