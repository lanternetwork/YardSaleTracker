import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Check for ingest token in headers
  const ingestToken = request.headers.get('X-INGEST-TOKEN')
  const expectedToken = process.env.INGEST_TOKEN

  // Allow dev-token for development
  if (expectedToken && ingestToken !== expectedToken && ingestToken !== 'dev-token') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // For now, return a mock status since we don't have persistent storage
    // In a real implementation, this would query a database for the last run
    const mockRun = {
      id: 'run_mock_123',
      status: 'completed',
      fetched_count: 15,
      new_count: 3,
      updated_count: 2,
      started_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      finished_at: new Date(Date.now() - 3500000).toISOString(), // 1 hour ago
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
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json({ 
      error: 'Failed to get status',
      message: error.message 
    }, { status: 500 })
  }
}
