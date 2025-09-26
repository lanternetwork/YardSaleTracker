import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  // Only allow in Preview/Development environments
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 })
  }

  try {
    const supabase = getAdminSupabase()
    
    // Get project reference (first 8 chars of URL)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectRef = supabaseUrl.slice(0, 8)
    
    // Check if service role key is available
    const hasServiceRoleKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)
    
    // Get sales count
    const { count: salesCount, error: salesError } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .eq('source', 'craigslist')
    
    if (salesError) {
      console.error('Error fetching sales count:', salesError)
    }
    
    // Get latest ingest run
    const { data: lastRun, error: runsError } = await supabase
      .from('ingest_runs')
      .select('*')
      .eq('source', 'craigslist')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()
    
    if (runsError && runsError.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching latest run:', runsError)
    }
    
    return NextResponse.json({
      hasServiceRoleKey,
      projectRef,
      salesCount: salesCount || 0,
      lastRun: lastRun || null,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('DB check error:', error)
    return NextResponse.json({ 
      error: 'Database check failed',
      message: error.message 
    }, { status: 500 })
  }
}
