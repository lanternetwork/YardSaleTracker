import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'

export async function GET() {
  try {
    // Test environment variables are loaded
    const supabase = createSupabaseServerClient()
    
    // Test database connection with a simple query
    const { data, error } = await supabase
      .from(T.sales)
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('Health check failed:', error)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Database connection failed',
          details: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      ok: true,
      timestamp: new Date().toISOString(),
      database: 'connected'
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
