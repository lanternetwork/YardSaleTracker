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

  // Get recent runs to surface sources (worker/action/snapshot/live)
  const { data: recentRuns } = await supabase
    .from('ingest_runs')
    .select('id, started_at, status, fetched_count, new_count, updated_count, details')
    .eq('source', 'craigslist')
    .order('started_at', { ascending: false })
    .limit(10)

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

      {/* Recent runs (compact) */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent runs</h2>
          <a href="/diagnostics/ingest" className="text-sm text-blue-600 hover:text-blue-800">Full diagnostics →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fetched</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Via</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(recentRuns || []).map((run: any) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900">{new Date(run.started_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${run.status === 'ok' ? 'bg-green-100 text-green-800' : run.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">{run.fetched_count}</td>
                  <td className="px-4 py-2 text-sm text-green-700">{run.new_count}</td>
                  <td className="px-4 py-2 text-sm text-blue-700">{run.updated_count}</td>
                  <td className="px-4 py-2 text-sm">
                    {run.details?.via ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{String(run.details.via)}</span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {(!recentRuns || recentRuns.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">No recent runs</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
