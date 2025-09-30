import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { T } from '@/lib/supabase/tables';

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.from(T.sales).select('id').limit(1);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({
      ok: true,
      schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public',
      sample: data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
