import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Test basic connection with simple query
    const { data, error } = await supabase
      .from('yard_sales')
      .select('id, title, city, state, lat, lng')
      .eq('status', 'active')
      .limit(5)
    
    if (error) {
      console.error('[TEST-DB] Database error:', error)
      return NextResponse.json({ 
        ok: false, 
        error: 'Database query failed',
        details: error.message,
        code: error.code
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
