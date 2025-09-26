import { NextRequest, NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SnapshotBody = {
  source: string
  site: string
  xml: string
}

function normalizeUrl(link: string, feedUrl: string): string | null {
  try {
    if (!link) return null
    if (link.startsWith('http://') || link.startsWith('https://')) {
      const url = new URL(link)
      if (url.protocol !== 'https:') return null
      if (url.hostname.endsWith('.craigslist.org') || url.hostname === 'craigslist.org') {
        return url.toString()
      }
      return null
    }
    const resolved = new URL(link, feedUrl)
    if (resolved.protocol !== 'https:') return null
    if (resolved.hostname.endsWith('.craigslist.org') || resolved.hostname === 'craigslist.org') {
      return resolved.toString()
    }
    return null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  // Auth header check
  const hdr = request.headers.get('x-ingest-token') || request.headers.get('X-INGEST-TOKEN')
  const expected = process.env.CRAIGSLIST_INGEST_TOKEN
  if (!expected || hdr !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: SnapshotBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { source = 'craigslist', site, xml } = body
  if (!site || !xml) {
    return NextResponse.json({ error: 'Missing site or xml' }, { status: 400 })
  }

  const supabase = getAdminSupabase()
  const runId = `snapshot_${Date.now()}`
  const startedAt = new Date()

  // Create run row (running)
  await supabase
    .from('ingest_runs')
    .insert({ id: runId, source, dry_run: false, status: 'running' })

  let fetchedCount = 0
  let newCount = 0
  let updatedCount = 0
  let invalidUrl = 0
  let parseError = 0
  const invalidSamples: Array<{ title?: string; link?: string }> = []

  try {
    const { XMLParser } = await import('fast-xml-parser')
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' })
    const feed = parser.parse(xml)
    const items = feed?.rss?.channel?.item || []

    const arrayItems = Array.isArray(items) ? items : items ? [items] : []
    fetchedCount = arrayItems.length

    for (const item of arrayItems) {
      try {
        const title: string = item?.title || 'Untitled Sale'
        const link: string = item?.link || item?.guid || ''
        const postedAt: string | undefined = item?.pubDate || item?.published || item?.date

        const normalized = normalizeUrl(link, site)
        if (!normalized) {
          invalidUrl++
          if (invalidSamples.length < 3) invalidSamples.push({ title, link })
          continue
        }

        // Deterministic source_id: prefer guid/link + postedAt
        const sourceKey = `${link}|${postedAt || ''}`
        const sourceId = Buffer.from(sourceKey).toString('base64url').slice(0, 60)

        // Check existing
        const { data: existing } = await supabase
          .from('sales')
          .select('id')
          .eq('source', source)
          .eq('source_id', sourceId)
          .single()

        const nowIso = new Date().toISOString()
        const saleData: any = {
          source,
          source_id: sourceId,
          title,
          url: normalized,
          posted_at: postedAt || nowIso,
          last_seen_at: nowIso,
          status: 'active'
        }

        if (existing) {
          const { error: upErr } = await supabase
            .from('sales')
            .update(saleData)
            .eq('id', existing.id)
          if (!upErr) updatedCount++
        } else {
          const { error: insErr } = await supabase
            .from('sales')
            .insert({ ...saleData, first_seen_at: nowIso })
          if (!insErr) newCount++
        }
      } catch {
        parseError++
      }
    }

    const finishedAt = new Date()
    await supabase
      .from('ingest_runs')
      .update({
        finished_at: finishedAt.toISOString(),
        fetched_count: fetchedCount,
        new_count: newCount,
        updated_count: updatedCount,
        status: 'ok',
        details: {
          via: 'snapshot',
          site,
          fetched_count: fetchedCount,
          kept: newCount + updatedCount,
          invalid_url: invalidUrl,
          parse_error: parseError,
        }
      })
      .eq('id', runId)

    return NextResponse.json({
      fetched_count: fetchedCount,
      new_count: newCount,
      updated_count: updatedCount,
      run_id: runId
    })
  } catch (err: any) {
    await supabase
      .from('ingest_runs')
      .update({
        finished_at: new Date().toISOString(),
        status: 'error',
        last_error: `${err?.name || 'Error'}: ${err?.message || 'ingest failed'}`,
        details: { via: 'snapshot', site }
      })
      .eq('id', runId)

    return NextResponse.json({ error: 'Snapshot ingest failed' }, { status: 500 })
  }
}


