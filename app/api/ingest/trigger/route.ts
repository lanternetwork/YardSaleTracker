import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/security/admin'

export async function POST(req: NextRequest) {
  // Allow either: server-to-server token OR admin user session
  const token = req.headers.get('x-ingest-token') || ''
  let authorized = false
  if (process.env.CRAIGSLIST_INGEST_TOKEN && token === process.env.CRAIGSLIST_INGEST_TOKEN) {
    authorized = true
  } else {
    try {
      const supabase = createSupabaseServer()
      const { data }: any = await supabase.auth.getUser()
      const email = data?.user?.email ?? null
      authorized = isAdminEmail(email)
    } catch {}
  }
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

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


