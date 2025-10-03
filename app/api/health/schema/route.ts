import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSchema } from '@/lib/supabase/schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const schema = getSchema()

    // Check presence of v2 sales table via per-query schema switch
    const { error } = await (supabase as any)
      .schema(schema)
      .from('sales')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, schema }, { status: 500 })
    }

    return NextResponse.json({ ok: true, schema })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'unknown' }, { status: 500 })
  }
}
