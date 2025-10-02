import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Test basic connection with simple query
    console.log('[TEST-DB] Testing yard_sales table...')
    const { data, error } = await supabase
      .from('yard_sales')
      .select('id, title, city, state, lat, lng')
      .eq('status', 'active')
      .limit(5)
    
    console.log('[TEST-DB] Query result:', { data: data?.length, error: error?.message })
    
    if (error) {
      console.error('[TEST-DB] Database error:', error)
      
      // Try to get table info
      const { data: tableInfo, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(10)
      
      return NextResponse.json({ 
        ok: false, 
        error: 'Database query failed',
        details: error.message,
        code: error.code,
        availableTables: tableInfo?.map(t => t.table_name) || [],
        tableError: tableError?.message
      }, { status: 500 })
    }
    
    return NextResponse.json({
      ok: true,
      count: data?.length || 0,
      data: data || [],
      message: 'Database connection successful'
    })
    
  } catch (error: any) {
    console.error('[TEST-DB] Unexpected error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
