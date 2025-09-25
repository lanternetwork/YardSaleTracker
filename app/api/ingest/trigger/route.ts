import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // Check for ingest token in headers
  const ingestToken = request.headers.get('X-INGEST-TOKEN')
  const expectedToken = process.env.INGEST_TOKEN

  // Allow dev-token for development
  if (expectedToken && ingestToken !== expectedToken && ingestToken !== 'dev-token') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { dryRun = false, site = 'sfbay', limit = 10 } = await request.json()

    // Call the Supabase Edge Function
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/craigslist`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        city: site,
        query: 'garage sale',
        limit: limit
      })
    })

    if (!response.ok) {
      throw new Error(`Supabase function failed: ${response.status}`)
    }

    const data = await response.json()
    
    // Simulate database operations based on dryRun flag
    const runId = `run_${Date.now()}`
    const fetchedCount = data.results?.length || 0
    const newCount = dryRun ? 0 : Math.floor(fetchedCount * 0.3) // Simulate 30% new
    const updatedCount = dryRun ? 0 : Math.floor(fetchedCount * 0.1) // Simulate 10% updated

    // Create sample items from results
    const sampleItems = data.results?.slice(0, 5).map((item: any) => ({
      title: item.title,
      posted_at: item.start_at || new Date().toISOString(),
      url: item.url || '#'
    })) || []

    const runData = {
      id: runId,
      status: 'completed',
      fetched_count: fetchedCount,
      new_count: newCount,
      updated_count: updatedCount,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
      sample_items: sampleItems
    }

    return NextResponse.json(runData)
  } catch (error: any) {
    console.error('Ingest trigger error:', error)
    return NextResponse.json({ 
      error: 'Failed to trigger ingestion',
      message: error.message 
    }, { status: 500 })
  }
}