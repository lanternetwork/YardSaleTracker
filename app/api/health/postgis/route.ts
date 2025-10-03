import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    
    // Test PostGIS functionality using public wrapper function
    const { data, error } = await supabase
      .rpc('test_postgis')

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'PostGIS functionality confirmed',
      result: data,
      missing_geom: data?.[0]?.missing_geom_count ?? 0,
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
      error: error instanceof Error ? error.message : 'Unknown PostGIS error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}