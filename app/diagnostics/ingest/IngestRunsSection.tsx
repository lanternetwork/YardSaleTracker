interface IngestRun {
  id: string
  started_at: string
  finished_at?: string
  source: string
  dry_run: boolean
  fetched_count: number
  new_count: number
  updated_count: number
  geocode_calls: number
  cache_hits: number
  status: string
  last_error?: string
}

interface IngestRunsSectionProps {
  runs: IngestRun[]
}

export default function IngestRunsSection({ runs }: IngestRunsSectionProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'running': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDuration = (started: string, finished?: string) => {
    if (!finished) return 'N/A'
    const start = new Date(started)
    const end = new Date(finished)
    const diffMs = end.getTime() - start.getTime()
    const diffSeconds = Math.round(diffMs / 1000)
    return `${diffSeconds}s`
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Recent Ingestion Runs</h2>
        <p className="mt-1 text-sm text-gray-600">Last 20 runs with status and counts</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fetched
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                New
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Updated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dry Run
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Error
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {runs.map((run) => (
              <tr key={run.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(run.status)}`}>
                    {run.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatTime(run.started_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {getDuration(run.started_at, run.finished_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {run.fetched_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                  {run.new_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  {run.updated_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {run.dry_run ? 'Yes' : 'No'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  {run.last_error || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {runs.length === 0 && (
        <div className="px-6 py-8 text-center text-gray-500">
          No ingestion runs found
        </div>
      )}
    </div>
  )
}
