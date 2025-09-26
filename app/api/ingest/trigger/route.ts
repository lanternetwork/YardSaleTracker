import { NextRequest, NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

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

// Extract location from RSS item
function extractLocationFromItem(item: any): string | null {
  // Try to extract from description first
  if (item.description) {
    const desc = item.description.toLowerCase()
    // Look for common location patterns
    const locationMatch = desc.match(/(?:in|at|near)\s+([a-z\s,]+?)(?:\s|$|\.|,)/i)
    if (locationMatch) {
      return locationMatch[1].trim()
    }
  }
  
  // Try to extract from title
  if (item.title) {
    const title = item.title.toLowerCase()
    // Look for location patterns in title
    const locationMatch = title.match(/(?:in|at|near)\s+([a-z\s,]+?)(?:\s|$|\.|,)/i)
    if (locationMatch) {
      return locationMatch[1].trim()
    }
  }
  
  return null
}

// Parse RSS date format
function parseRssDate(dateString: string): string | null {
  if (!dateString) return null
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return null
    }
    return date.toISOString()
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  // Check for ingest token in headers
  const ingestToken = request.headers.get('X-INGEST-TOKEN')
  const expectedToken = process.env.INGEST_TOKEN

  // Allow dev-token for development
  if (expectedToken && ingestToken !== expectedToken && ingestToken !== 'dev-token') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = adminSupabase
  const runId = `run_${Date.now()}`
  const startTime = new Date()

  try {
    const { dryRun = false, site = 'sfbay', limit = 10 } = await request.json()

    // Get RSS URLs from environment (comma-separated)
    const craigslistSites = process.env.CRAIGSLIST_SITES || `https://${site}.craigslist.org/search/garage-sale?format=rss`
    const rssUrls = craigslistSites.split(',').map(url => url.trim())

    // Preview-only environment logging (no secrets)
    if (process.env.VERCEL_ENV === 'preview') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      const supabaseUrlRef = supabaseUrl.slice(0, 8)
      const hasServiceRoleKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)
      console.log(`[PREVIEW] supabaseUrlRef=${supabaseUrlRef}, hasServiceRoleKey=${hasServiceRoleKey}, dryRun=${dryRun}, sitesCount=${rssUrls.length}`)
    }

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

    // Parse RSS feeds from environment URLs
    let rssItems: any[] = []
    
    for (const feedUrl of rssUrls) {
      try {
        console.log(`Fetching RSS feed from: ${feedUrl}`)
        const feedResponse = await fetch(feedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; YardSaleTracker/1.0; +https://lootaura.com)'
          }
        })
        
        if (!feedResponse.ok) {
          console.error(`RSS feed fetch failed: ${feedResponse.status} ${feedResponse.statusText}`)
          continue
        }
        
        const feedText = await feedResponse.text()
        console.log(`RSS feed fetched, length: ${feedText.length} characters`)
        
        // Parse RSS XML
        const parser = new (await import('fast-xml-parser')).XMLParser({
          ignoreAttributes: false,
          attributeNamePrefix: '@_'
        })
        
        const feedData = parser.parse(feedText)
        const items = feedData?.rss?.channel?.item || []
        
        if (Array.isArray(items)) {
          rssItems.push(...items.slice(0, limit))
        } else if (items) {
          rssItems.push(items)
        }
        
        console.log(`Parsed ${items.length} RSS items from ${feedUrl}`)
      } catch (error) {
        console.error(`Error fetching/parsing RSS feed from ${feedUrl}:`, error)
        // Continue to next URL instead of falling back to mock data
        continue
      }
    }
    
    // Limit total items
    rssItems = rssItems.slice(0, limit)
    console.log(`Total RSS items collected: ${rssItems.length}`)

    let fetchedCount = 0
    let newCount = 0
    let updatedCount = 0
    let invalidUrlCount = 0
    const sampleItems: any[] = []

    // Process each RSS item
    for (const item of rssItems) {
      fetchedCount++
      
      // Normalize URL (use the first RSS URL as fallback for relative links)
      const normalizedUrl = normalizeUrl(item.link, rssUrls[0] || `https://${site}.craigslist.org/search/garage-sale?format=rss`)
      if (!normalizedUrl) {
        invalidUrlCount++
        continue
      }

      const sourceId = generateSourceId(item)
      const now = new Date().toISOString()
      
      // Extract location from description or title
      const locationText = extractLocationFromItem(item)
      
      // Parse posted date from RSS item
      const postedAt = parseRssDate(item.pubDate || item.published || item.date)

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
            title: item.title || 'Untitled Sale',
            url: normalizedUrl,
            location_text: locationText,
            posted_at: postedAt,
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