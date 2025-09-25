import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-ingest-token') || ''
  if (!process.env.CRAIGSLIST_INGEST_TOKEN || token !== process.env.CRAIGSLIST_INGEST_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // Validate payload
  let body: any = {}
  try {
    body = await req.json()
  } catch {}

  const dryRun = Boolean(body?.dryRun)
  const site = typeof body?.site === 'string' ? body.site : null
  const limit = typeof body?.limit === 'number' ? Math.max(1, Math.min(1000, body.limit)) : null

  // TODO: enqueue background job with payload
  return new Response(JSON.stringify({ accepted: true, dryRun, site, limit }), { status: 202 })
}


