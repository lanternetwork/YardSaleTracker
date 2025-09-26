import { NextRequest } from 'next/server'

export async function POST(_req: NextRequest) {
  // TODO: implement batch ingest worker (RSS-first)
  // This endpoint should be called by cron/trigger until Edge Function is in place.
  return new Response(JSON.stringify({ ok: true }), { status: 200 })
}


