import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-ingest-token') || ''
  if (!process.env.CRAIGSLIST_INGEST_TOKEN || token !== process.env.CRAIGSLIST_INGEST_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  // TODO: enqueue background job (Supabase Edge Function or background route)
  return new Response(JSON.stringify({ accepted: true }), { status: 202 })
}


