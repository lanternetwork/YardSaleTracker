import { getAdminSupabase } from '@/lib/supabase/admin'
import IngestDebugConsole from './IngestDebugConsole'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // Ensure page is not statically cached

export default async function IngestDebugConsolePage() {
  const supabase = getAdminSupabase()

  // Get configuration snapshot
  const hasServiceRoleKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').slice(0, 8)
  const sites = (process.env.CRAIGSLIST_SITES || '').split(',').map(url => url.trim()).filter(url => url.length > 0)
  const serverTime = new Date().toISOString()

  // Get latest ingest run for context
  const { data: latestRun } = await supabase
    .from('ingest_runs')
    .select('*')
    .eq('source', 'craigslist')
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Ingestion Debug Console</h1>
        <p className="text-gray-600">
          Step-by-step observability for Craigslist RSS ingestion pipeline
        </p>
      </div>
      
      <IngestDebugConsole 
        hasServiceRoleKey={hasServiceRoleKey}
        projectRef={projectRef}
        sites={sites}
        serverTime={serverTime}
        latestRun={latestRun}
      />
    </div>
  )
}
