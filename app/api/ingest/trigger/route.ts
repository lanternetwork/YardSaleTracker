import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

// URL normalization function
function normalizeUrl(link: string, feedUrl: string): string | null {
  try {
    // If link is already absolute, use it directly
    if (link.startsWith('http://') || link.startsWith('https://')) {
      const url = new URL(link)
      // Only accept craigslist.org URLs
      if (url.hostname.endsWith('.craigslist.org') || url.hostname === 'craigslist.org') {
        return url.toString()
      }
      return null // Reject non-craigslist URLs
    }
    
    // If link is relative, resolve against feed URL
    const feedUrlObj = new URL(feedUrl)
    const resolvedUrl = new URL(link, feedUrlObj.origin)
    
    // Only accept craigslist.org URLs
    if (resolvedUrl.hostname.endsWith('.craigslist.org') || resolvedUrl.hostname === 'craigslist.org') {
      return resolvedUrl.toString()
    }
    
    return null // Reject non-craigslist URLs
  } catch (error) {
    return null // Invalid URL
  }
}

// Generate stable source_id from item data
function generateSourceId(item: any): string {
  // Prefer RSS guid if it's a URL with an ID
  if (item.guid && item.guid.startsWith('http')) {
    try {
      const url = new URL(item.guid)
      const pathParts = url.pathname.split('/')
      const id = pathParts[pathParts.length - 1]
      if (id && id.length > 5) {
        return id
      }
    } catch (error) {
      // Fall through to hash method
    }
  }
  
  // Fallback: hash of (link|title|posted_at)
  const hashInput = `${item.link || ''}|${item.title || ''}|${item.posted_at || ''}`
  return Buffer.from(hashInput).toString('base64').slice(0, 20)
}

export async function POST(request: NextRequest) {
  // Check for ingest token in headers
  const ingestToken = request.headers.get('X-INGEST-TOKEN')
  const expectedToken = process.env.INGEST_TOKEN

  // Allow dev-token for development
  if (expectedToken && ingestToken !== expectedToken && ingestToken !== 'dev-token') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createSupabaseServer()
  const runId = `run_${Date.now()}`
  const startTime = new Date()

  try {
    const { dryRun = false, site = 'sfbay', limit = 10 } = await request.json()

    // Create ingest run record
    const { data: runRecord, error: runError } = await supabase
      .from('ingest_runs')
      .insert({
        id: runId,
        source: 'craigslist',
        dry_run: dryRun,
        status: 'running'
      })
      .select()
      .single()

    if (runError) {
      console.error('Error creating ingest run:', runError)
    }

    // Simulate RSS feed parsing with mock data
    const feedUrl = `https://${site}.craigslist.org/search/garage-sale?format=rss`
    const mockRssItems = Array.from({ length: Math.min(limit, 15) }, (_, i) => ({
      title: `Garage Sale ${i + 1} - ${site.toUpperCase()}`,
      link: `https://${site}.craigslist.org/garage-sale/mock-${i}`,
      guid: `https://${site}.craigslist.org/garage-sale/mock-${i}`,
      description: `Mock garage sale description ${i + 1}`,
      posted_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      location_text: `${site} Area`
    }))

    let fetchedCount = 0
    let newCount = 0
    let updatedCount = 0
    let invalidUrlCount = 0
    const sampleItems: any[] = []

    // Process each RSS item
    for (const item of mockRssItems) {
      fetchedCount++
      
      // Normalize URL
      const normalizedUrl = normalizeUrl(item.link, feedUrl)
      if (!normalizedUrl) {
        invalidUrlCount++
        continue
      }

      const sourceId = generateSourceId(item)
      const now = new Date().toISOString()

      if (!dryRun) {
        try {
          // Upsert into sales table
          const { data: existingSale, error: selectError } = await supabase
            .from('sales')
            .select('id, first_seen_at')
            .eq('source', 'craigslist')
            .eq('source_id', sourceId)
            .single()

          if (selectError && selectError.code !== 'PGRST116') { // Not found is OK
            console.error('Error checking existing sale:', selectError)
            continue
          }

          const saleData = {
            source: 'craigslist',
            source_id: sourceId,
            title: item.title,
            url: normalizedUrl,
            location_text: item.location_text,
            posted_at: item.posted_at,
            last_seen_at: now,
            status: 'active',
            source_host: new URL(normalizedUrl).hostname
          }

          if (existingSale) {
            // Update existing sale
            const { error: updateError } = await supabase
              .from('sales')
              .update(saleData)
              .eq('id', existingSale.id)

            if (updateError) {
              console.error('Error updating sale:', updateError)
            } else {
              updatedCount++
            }
          } else {
            // Insert new sale
            const { error: insertError } = await supabase
              .from('sales')
              .insert({
                ...saleData,
                first_seen_at: now
              })

            if (insertError) {
              console.error('Error inserting sale:', insertError)
            } else {
              newCount++
            }
          }
        } catch (error) {
          console.error('Error processing sale:', error)
        }
      }

      // Add to sample items (first 5)
      if (sampleItems.length < 5) {
        sampleItems.push({
          title: item.title,
          posted_at: item.posted_at,
          url: normalizedUrl
        })
      }
    }

    const endTime = new Date()
    const lastError = invalidUrlCount > 0 ? `${invalidUrlCount} items had invalid URLs` : null

    // Update ingest run record
    await supabase
      .from('ingest_runs')
      .update({
        finished_at: endTime.toISOString(),
        fetched_count: fetchedCount,
        new_count: newCount,
        updated_count: updatedCount,
        status: 'ok',
        last_error: lastError
      })
      .eq('id', runId)

    const runData = {
      id: runId,
      status: 'completed',
      fetched_count: fetchedCount,
      new_count: newCount,
      updated_count: updatedCount,
      started_at: startTime.toISOString(),
      finished_at: endTime.toISOString(),
      sample_items: sampleItems,
      invalid_url_count: invalidUrlCount
    }

    return NextResponse.json(runData)
  } catch (error: any) {
    console.error('Ingest trigger error:', error)
    
    // Update run record with error
    await supabase
      .from('ingest_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: 'error',
        last_error: error.message
      })
      .eq('id', runId)

    return NextResponse.json({ 
      error: 'Failed to trigger ingestion',
      message: error.message 
    }, { status: 500 })
  }
}