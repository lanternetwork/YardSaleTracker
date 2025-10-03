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

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    
    // Query information_schema.tables to get table names
    const { data, error } = await supabase
      .rpc('get_table_names')

    // If the RPC doesn't exist, fall back to a direct query
    if (error && error.message.includes('function get_table_names')) {
      const { data: tableData, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')

      if (tableError) {
        return NextResponse.json({
          ok: false,
          error: tableError.message,
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }

      const tables = tableData?.map(row => row.table_name) || []
      
      return NextResponse.json({
        ok: true,
        tables,
        count: tables.length,
        timestamp: new Date().toISOString()
      })
    }

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      tables: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // Handle missing environment variables gracefully
    if (error instanceof Error && error.message.includes('is missing')) {
      return NextResponse.json({
        ok: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
    
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown schema error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}