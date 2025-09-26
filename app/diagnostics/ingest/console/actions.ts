'use server'

import { getAdminSupabase } from '@/lib/supabase/admin'

interface FetchResult {
  url: string
  status: number
  contentType: string
  bytes: number
  elapsedMs: number
  success: boolean
  error?: string
  body?: string
}

interface ParseResult {
  itemCount: number
  samples: Array<{
    title: string
    link: string
    pubDate: string
  }>
  skipped: boolean
  skipReason?: string
}

interface FilterResult {
  kept: number
  invalidUrl: number
  parseError: number
  duplicateSourceId: number
  normalizedUrls: string[]
}

interface UpsertResult {
  wouldInsert: number
  wouldUpdate: number
  newCount: number
  updatedCount: number
  runId?: string
}

interface LinkValidationResult {
  status200: number
  status301: number
  status404: number
  timeout: number
  failures: Array<{
    url: string
    status: number
    error?: string
  }>
}

export async function fetchSites(sites: string[]): Promise<FetchResult[]> {
  const results: FetchResult[] = []
  
  for (const site of sites) {
    const startTime = Date.now()
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000) // 7s timeout
      
      // Create referer URL (same as feed URL but without ?format=rss)
      const refererUrl = site.replace('?format=rss', '').replace('&format=rss', '')
      
      const response = await fetch(site, {
        cache: 'no-store',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Referer': refererUrl,
          'Accept': 'application/rss+xml, text/xml;q=0.9, */*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      const body = await response.text()
      const elapsedMs = Date.now() - startTime
      
      results.push({
        url: site,
        status: response.status,
        contentType: response.headers.get('content-type') || 'unknown',
        bytes: body.length,
        elapsedMs,
        success: response.ok,
        body: response.ok ? body : undefined
      })
    } catch (error) {
      const elapsedMs = Date.now() - startTime
      const errorObj = error as Error
      
      results.push({
        url: site,
        status: 0,
        contentType: 'error',
        bytes: 0,
        elapsedMs,
        success: false,
        error: `${errorObj.name}: ${errorObj.message}`
      })
    }
  }
  
  return results
}

export async function parseFeeds(fetchResults: FetchResult[]): Promise<ParseResult> {
  const allSamples: Array<{ title: string; link: string; pubDate: string }> = []
  let totalItems = 0
  
  for (const result of fetchResults) {
    if (!result.success || !result.body) {
      continue
    }
    
    // Check if content type indicates XML/RSS
    const contentType = result.contentType.toLowerCase()
    if (!contentType.includes('xml') && !contentType.includes('rss')) {
      continue
    }
    
    try {
      const { XMLParser } = await import('fast-xml-parser')
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_'
      })
      
      const feedData = parser.parse(result.body)
      const items = feedData?.rss?.channel?.item || []
      
      if (Array.isArray(items)) {
        totalItems += items.length
        allSamples.push(...items.slice(0, 3).map((item: any) => ({
          title: item.title || 'Untitled',
          link: item.link || item.guid || '',
          pubDate: item.pubDate || item.published || item.date || ''
        })))
      } else if (items) {
        totalItems += 1
        allSamples.push({
          title: items.title || 'Untitled',
          link: items.link || items.guid || '',
          pubDate: items.pubDate || items.published || items.date || ''
        })
      }
    } catch (error) {
      console.error('Parse error for', result.url, error)
    }
  }
  
  return {
    itemCount: totalItems,
    samples: allSamples.slice(0, 3),
    skipped: totalItems === 0,
    skipReason: totalItems === 0 ? 'No valid XML/RSS content found or fetch failed' : undefined
  }
}

export async function filterAndNormalize(parseResult: ParseResult, feedUrls: string[]): Promise<FilterResult> {
  if (parseResult.skipped) {
    return {
      kept: 0,
      invalidUrl: 0,
      parseError: 0,
      duplicateSourceId: 0,
      normalizedUrls: []
    }
  }
  
  const normalizedUrls: string[] = []
  let kept = 0
  let invalidUrl = 0
  let parseError = 0
  let duplicateSourceId = 0
  
  for (const sample of parseResult.samples) {
    try {
      let normalizedUrl: string | null = null
      
      if (sample.link.startsWith('http://') || sample.link.startsWith('https://')) {
        const url = new URL(sample.link)
        if (url.hostname.endsWith('.craigslist.org') || url.hostname === 'craigslist.org') {
          normalizedUrl = url.toString()
        }
      } else if (sample.link.startsWith('/')) {
        // Relative URL - resolve against first feed URL
        const feedUrl = feedUrls[0]
        if (feedUrl) {
          const resolvedUrl = new URL(sample.link, feedUrl).toString()
          if (resolvedUrl.includes('craigslist.org')) {
            normalizedUrl = resolvedUrl
          }
        }
      }
      
      if (normalizedUrl) {
        kept++
        if (normalizedUrls.length < 5) {
          normalizedUrls.push(normalizedUrl)
        }
      } else {
        invalidUrl++
      }
    } catch (error) {
      parseError++
    }
  }
  
  return {
    kept,
    invalidUrl,
    parseError,
    duplicateSourceId,
    normalizedUrls
  }
}

export async function simulateUpsert(filterResult: FilterResult): Promise<UpsertResult> {
  const supabase = getAdminSupabase()
  
  let wouldInsert = 0
  let wouldUpdate = 0
  
  for (const url of filterResult.normalizedUrls) {
    try {
      // Generate a mock source_id for simulation
      const sourceId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const { data: existing } = await supabase
        .from('sales')
        .select('id')
        .eq('source', 'craigslist')
        .eq('source_id', sourceId)
        .single()
      
      if (existing) {
        wouldUpdate++
      } else {
        wouldInsert++
      }
    } catch (error) {
      // Ignore errors in simulation
    }
  }
  
  return {
    wouldInsert,
    wouldUpdate,
    newCount: 0,
    updatedCount: 0
  }
}

export async function runNow(): Promise<UpsertResult> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ingest/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-INGEST-TOKEN': 'dev-token'
      },
      body: JSON.stringify({ dryRun: false, limit: 50 })
    })
    
    const result = await response.json()
    
    return {
      wouldInsert: result.new_count || 0,
      wouldUpdate: result.updated_count || 0,
      newCount: result.new_count || 0,
      updatedCount: result.updated_count || 0,
      runId: result.id
    }
  } catch (error) {
    console.error('Run Now error:', error)
    throw error
  }
}

export async function validateLinks(normalizedUrls: string[]): Promise<LinkValidationResult> {
  const result: LinkValidationResult = {
    status200: 0,
    status301: 0,
    status404: 0,
    timeout: 0,
    failures: []
  }
  
  const urlsToCheck = normalizedUrls.slice(0, 10)
  
  for (const url of urlsToCheck) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 7000)
      
      const response = await fetch(url, {
        cache: 'no-store',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LootAuraBot/0.1; +https://lootaura.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.status === 200) {
        result.status200++
      } else if (response.status === 301) {
        result.status301++
      } else if (response.status === 404) {
        result.status404++
      } else {
        result.failures.push({
          url,
          status: response.status
        })
      }
    } catch (error) {
      const errorObj = error as Error
      if (errorObj.name === 'AbortError') {
        result.timeout++
      } else {
        result.failures.push({
          url,
          status: 0,
          error: errorObj.message
        })
      }
    }
  }
  
  return result
}

export async function parseXmlSnapshot(xmlContent: string, feedUrl?: string): Promise<ParseResult> {
  try {
    const { XMLParser } = await import('fast-xml-parser')
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_'
    })
    
    const feedData = parser.parse(xmlContent)
    const items = feedData?.rss?.channel?.item || []
    
    let allItems: any[] = []
    if (Array.isArray(items)) {
      allItems = items
    } else if (items) {
      allItems = [items]
    }
    
    const samples = allItems.slice(0, 3).map((item: any) => ({
      title: item.title || 'Untitled',
      link: item.link || item.guid || '',
      pubDate: item.pubDate || item.published || item.date || ''
    }))
    
    return {
      itemCount: allItems.length,
      samples,
      skipped: false
    }
  } catch (error) {
    const errorObj = error as Error
    return {
      itemCount: 0,
      samples: [],
      skipped: true,
      skipReason: `Parse error: ${errorObj.name}: ${errorObj.message}`
    }
  }
}

export async function runSnapshotUpsert(parseResult: ParseResult, feedUrl: string): Promise<UpsertResult> {
  if (parseResult.skipped) {
    throw new Error(parseResult.skipReason || 'Parse was skipped')
  }
  
  const supabase = getAdminSupabase()
  const runId = `snapshot_${Date.now()}`
  const startTime = new Date()
  
  try {
    // Create ingest run record
    const { error: runError } = await supabase
      .from('ingest_runs')
      .insert({
        id: runId,
        source: 'craigslist',
        dry_run: false,
        status: 'running'
      })
    
    if (runError) {
      throw new Error(`Failed to create run record: ${runError.message}`)
    }
    
    let newCount = 0
    let updatedCount = 0
    const invalidSamples: any[] = []
    
    // Process each item
    for (const sample of parseResult.samples) {
      try {
        // Normalize URL
        let normalizedUrl: string | null = null
        
        if (sample.link.startsWith('http://') || sample.link.startsWith('https://')) {
          const url = new URL(sample.link)
          if (url.hostname.endsWith('.craigslist.org') || url.hostname === 'craigslist.org') {
            normalizedUrl = url.toString()
          }
        } else if (sample.link.startsWith('/')) {
          const resolvedUrl = new URL(sample.link, feedUrl).toString()
          if (resolvedUrl.includes('craigslist.org')) {
            normalizedUrl = resolvedUrl
          }
        }
        
        if (!normalizedUrl) {
          invalidSamples.push({ title: sample.title, link: sample.link })
          continue
        }
        
        // Generate source_id
        const sourceId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        // Check if exists
        const { data: existing } = await supabase
          .from('sales')
          .select('id, first_seen_at')
          .eq('source', 'craigslist')
          .eq('source_id', sourceId)
          .single()
        
        const now = new Date().toISOString()
        const saleData = {
          source: 'craigslist',
          source_id: sourceId,
          title: sample.title,
          url: normalizedUrl,
          posted_at: sample.pubDate || now,
          last_seen_at: now,
          status: 'active'
        }
        
        if (existing) {
          // Update existing
          const { error: updateError } = await supabase
            .from('sales')
            .update(saleData)
            .eq('id', existing.id)
          
          if (updateError) {
            console.error('Update error:', updateError)
          } else {
            updatedCount++
          }
        } else {
          // Insert new
          const { error: insertError } = await supabase
            .from('sales')
            .insert({
              ...saleData,
              first_seen_at: now
            })
          
          if (insertError) {
            console.error('Insert error:', insertError)
          } else {
            newCount++
          }
        }
      } catch (error) {
        console.error('Error processing item:', error)
      }
    }
    
    // Update run record
    const endTime = new Date()
    await supabase
      .from('ingest_runs')
      .update({
        finished_at: endTime.toISOString(),
        fetched_count: parseResult.itemCount,
        new_count: newCount,
        updated_count: updatedCount,
        status: 'ok',
        details: {
          source: 'snapshot',
          feed_url: feedUrl,
          parse_stats: {
            raw_items: parseResult.itemCount,
            sample_titles: parseResult.samples.map(s => s.title)
          },
          invalid_samples: invalidSamples.slice(0, 3)
        }
      })
      .eq('id', runId)
    
    return {
      wouldInsert: newCount,
      wouldUpdate: updatedCount,
      newCount,
      updatedCount,
      runId
    }
  } catch (error) {
    // Update run record with error
    await supabase
      .from('ingest_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: 'error',
        last_error: (error as Error).message
      })
      .eq('id', runId)
    
    throw error
  }
}
