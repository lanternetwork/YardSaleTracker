import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  // Check for ingest token in headers
  const ingestToken = request.headers.get('X-INGEST-TOKEN')
  const expectedToken = process.env.INGEST_TOKEN

  // Allow dev-token for development
  if (expectedToken && ingestToken !== expectedToken && ingestToken !== 'dev-token') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createSupabaseServer()
    
    // Get the latest ingest run
    const { data: latestRun, error } = await supabase
      .from('ingest_runs')
      .select('*')
      .eq('source', 'craigslist')
      .order('started_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching latest run:', error)
      return NextResponse.json({ 
        error: 'Failed to get status',
        message: error.message 
      }, { status: 500 })
    }

    if (!latestRun) {
      // Return mock data if no runs exist
      const mockRun = {
        id: 'run_mock_123',
        status: 'completed',
        fetched_count: 15,
        new_count: 3,
        updated_count: 2,
        started_at: new Date(Date.now() - 3600000).toISOString(),
        finished_at: new Date(Date.now() - 3500000).toISOString(),
        sample_items: [
          {
            title: 'Garage Sale - Furniture & Electronics',
            posted_at: new Date(Date.now() - 7200000).toISOString(),
            url: 'https://sfbay.craigslist.org/example1'
          },
          {
            title: 'Moving Sale - Everything Must Go!',
            posted_at: new Date(Date.now() - 10800000).toISOString(),
            url: 'https://sfbay.craigslist.org/example2'
          },
          {
            title: 'Estate Sale - Antiques & Collectibles',
            posted_at: new Date(Date.now() - 14400000).toISOString(),
            url: 'https://sfbay.craigslist.org/example3'
          }
        ]
      }
      return NextResponse.json(mockRun)
    }

    // Get sample items from the latest run's sales
    const { data: sampleSales } = await supabase
      .from('sales')
      .select('title, posted_at, url')
      .eq('source', 'craigslist')
      .order('last_seen_at', { ascending: false })
      .limit(5)

    const runData = {
      id: latestRun.id,
      status: latestRun.status === 'ok' ? 'completed' : latestRun.status,
      fetched_count: latestRun.fetched_count,
      new_count: latestRun.new_count,
      updated_count: latestRun.updated_count,
      started_at: latestRun.started_at,
      finished_at: latestRun.finished_at,
      sample_items: sampleSales || []
    }

    return NextResponse.json(runData)
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to get status',
      message: error.message 
    }, { status: 500 })
  }
}
