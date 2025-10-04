import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    
    // Test basic database connection
    const { data: testData, error: testError } = await supabase
      .from('sales')
      .select('id, title, city, lat, lng, status')
      .limit(5)
    
    if (testError) {
      return NextResponse.json({
        ok: false,
        error: 'Database connection failed',
        details: testError.message
      })
    }
    
    // Test sales_v2 view if it exists
    let viewData = null
    let viewError = null
    try {
      const { data, error } = await supabase
        .from('sales_v2')
        .select('id, title, city, lat, lng')
        .limit(5)
      viewData = data
      viewError = error
    } catch (err) {
      viewError = err
    }
    
    return NextResponse.json({
      ok: true,
      message: 'Database connection successful',
      sales_count: testData?.length || 0,
      sales_data: testData,
      sales_v2_available: !viewError,
      sales_v2_count: viewData?.length || 0,
      sales_v2_data: viewData,
      view_error: viewError ? (viewError as any)?.message || String(viewError) : null
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: 'API error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}