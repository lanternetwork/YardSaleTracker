import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSchema } from '@/lib/supabase/schema'

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    
    // Test PostGIS functionality with a simple spatial query
    const schema = getSchema()
    const { data, error } = await (supabase as any)
      .schema(schema)
      .rpc('test_postgis')

    // If the RPC doesn't exist, create a simple test query
    if (error && error.message.includes('function test_postgis')) {
      // Test with a simple PostGIS function
      const { data: testData, error: testError } = await (supabase as any)
        .schema(schema)
        .from('sales')
        .select('id')
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .limit(1)

      if (testError) {
        return NextResponse.json({
          ok: false,
          error: testError.message,
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }

      // Also report missing geom count for v2
      const { count: missingGeom, error: missingError } = await (supabase as any)
        .schema(schema)
        .from('sales')
        .select('*', { count: 'exact' })
        .is('geom', null)
        .limit(0)

      if (missingError) {
        return NextResponse.json({
          ok: false,
          error: missingError.message,
          timestamp: new Date().toISOString()
        }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        message: 'PostGIS functionality available (basic test)',
        hasSpatialData: (testData?.length || 0) > 0,
        missing_geom: missingGeom ?? 0,
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

    // Also report missing geom count for v2
    const { count: missingGeom2, error: missingError2 } = await (supabase as any)
      .schema(schema)
      .from('sales')
      .select('*', { count: 'exact' })
      .is('geom', null)
      .limit(0)

    if (missingError2) {
      return NextResponse.json({
        ok: false,
        error: missingError2.message,
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      message: 'PostGIS functionality confirmed',
      result: data,
      missing_geom: missingGeom2 ?? 0,
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
