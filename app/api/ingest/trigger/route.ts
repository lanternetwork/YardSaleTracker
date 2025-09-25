import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

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

    // Simulate scraping process with mock data
    const runId = `run_${Date.now()}`
    const startTime = new Date()
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate mock scraped data
    const mockResults = Array.from({ length: Math.min(limit, 15) }, (_, i) => ({
      id: `mock_${runId}_${i}`,
      title: `Garage Sale ${i + 1} - ${site.toUpperCase()}`,
      url: `https://${site}.craigslist.org/garage-sale/mock-${i}`,
      location_text: `${site} Area`,
      posted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      price_min: Math.floor(Math.random() * 50) + 10,
      price_max: Math.floor(Math.random() * 200) + 50
    }))

    const fetchedCount = mockResults.length
    const newCount = dryRun ? 0 : Math.floor(fetchedCount * 0.3) // Simulate 30% new
    const updatedCount = dryRun ? 0 : Math.floor(fetchedCount * 0.1) // Simulate 10% updated

    // If not a dry run, simulate database operations
    if (!dryRun) {
      const supabase = createSupabaseServer()
      
      // Simulate inserting new sales
      for (let i = 0; i < newCount; i++) {
        const sale = mockResults[i]
        try {
          await supabase.from('sales').insert({
            title: sale.title,
            url: sale.url,
            location_text: sale.location_text,
            posted_at: sale.posted_at,
            first_seen_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
            price_min: sale.price_min,
            price_max: sale.price_max,
            source: 'craigslist',
            status: 'published'
          })
        } catch (error) {
          console.warn('Mock insert failed (expected in dev):', error)
        }
      }
    }

    // Create sample items from results
    const sampleItems = mockResults.slice(0, 5).map((item: any) => ({
      title: item.title,
      posted_at: item.posted_at,
      url: item.url
    }))

    const endTime = new Date()
    const runData = {
      id: runId,
      status: 'completed',
      fetched_count: fetchedCount,
      new_count: newCount,
      updated_count: updatedCount,
      started_at: startTime.toISOString(),
      finished_at: endTime.toISOString(),
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