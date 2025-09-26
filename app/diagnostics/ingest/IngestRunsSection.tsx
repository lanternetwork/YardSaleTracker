'use client'
import { useState } from 'react'

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
  details?: any
}

interface IngestRunsSectionProps {
  runs: IngestRun[]
}

export default function IngestRunsSection({ runs }: IngestRunsSectionProps) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDuration = (started: string, finished?: string) => {
    if (!finished) return 'Running...'
    const start = new Date(started)
    const end = new Date(finished)
    const duration = end.getTime() - start.getTime()
    return `${Math.round(duration / 1000)}s`
  }

  const renderDetails = (details: any) => {
    if (!details) return null

    return (
      <div className="mt-4 space-y-4">
        {/* Sites */}
        {details.sites && (
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">Sites</h4>
            <div className="space-y-1">
              {details.sites.map((site: any, index: number) => (
                <div key={index} className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded">
                  {site.hostname}{site.pathname}{site.search}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fetch Stats */}
        {details.fetch_stats && (
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">Fetch Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>Total Sites: {details.fetch_stats.total_sites}</div>
              <div>Successful: {details.fetch_stats.successful_fetches}</div>
              <div>Failed: {details.fetch_stats.failed_fetches}</div>
              {details.fetch_stats.site_errors?.length > 0 && (
                <div className="col-span-2">
                  <div className="text-red-600">Errors:</div>
                  {details.fetch_stats.site_errors.map((error: string, index: number) => (
                    <div key={index} className="text-red-600 text-xs">{error}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Parse Stats */}
        {details.parse_stats && (
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">Parse Stats</h4>
            <div className="text-xs">
              <div>Raw Items: {details.parse_stats.raw_items}</div>
              {details.parse_stats.sample_titles?.length > 0 && (
                <div className="mt-2">
                  <div className="text-gray-600 mb-1">Sample Titles:</div>
                  {details.parse_stats.sample_titles.map((title: string, index: number) => (
                    <div key={index} className="text-xs text-gray-600 bg-gray-50 p-1 rounded mb-1">
                      {title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filter Stats */}
        {details.filter_stats && (
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">Filter Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>Kept: {details.filter_stats.kept}</div>
              <div>Invalid URL: {details.filter_stats.invalid_url}</div>
              <div>Parse Error: {details.filter_stats.parse_error}</div>
              <div>Duplicate: {details.filter_stats.duplicate_source_id}</div>
            </div>
          </div>
        )}

        {/* User Agent */}
        {details.user_agent && (
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">User Agent</h4>
            <div className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded">
              {details.user_agent}
            </div>
          </div>
        )}

        {/* Invalid Samples */}
        {details.invalid_samples?.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-900 mb-2">Invalid Samples</h4>
            <div className="space-y-2">
              {details.invalid_samples.map((sample: any, index: number) => (
                <div key={index} className="text-xs bg-red-50 p-2 rounded">
                  <div className="font-medium">{sample.title}</div>
                  <div className="text-red-600 font-mono">{sample.link}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Recent Ingestion Runs</h2>
        <p className="text-sm text-gray-600">Latest 20 runs from the database</p>
      </div>
      
      {runs.length === 0 ? (
        <div className="p-6 text-center">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No ingestion runs found</h3>
          <p className="text-gray-600 mb-4">No runs have been executed yet. Try running the ingestion process.</p>
          <a 
            href="/diagnostics/ingest/console" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Open Debug Console
          </a>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {runs.map((run) => (
            <div key={run.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}>
                      {run.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {run.source} {run.dry_run ? '(Dry Run)' : ''}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(run.started_at)} • {getDuration(run.started_at, run.finished_at)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {expandedRun === run.id ? 'Hide Details' : 'Show Details'}
                </button>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Fetched</div>
                  <div className="font-medium">{run.fetched_count}</div>
                </div>
                <div>
                  <div className="text-gray-500">New</div>
                  <div className="font-medium text-green-600">{run.new_count}</div>
                </div>
                <div>
                  <div className="text-gray-500">Updated</div>
                  <div className="font-medium text-blue-600">{run.updated_count}</div>
                </div>
                <div>
                  <div className="text-gray-500">Geocode Calls</div>
                  <div className="font-medium">{run.geocode_calls}</div>
                </div>
                <div>
                  <div className="text-gray-500">Via</div>
                  <div className="font-medium">
                    {run.details?.via ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {String(run.details.via)}
                      </span>
                    ) : '-'}
                  </div>
                </div>
              </div>
              
              {run.last_error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-sm text-red-800">
                    <strong>Error:</strong> {run.last_error}
                  </div>
                </div>
              )}
              
              {expandedRun === run.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <div className="text-sm text-gray-700">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <strong>Run ID:</strong> {run.id}
                      </div>
                      <div>
                        <strong>Source:</strong> {run.source}
                      </div>
                      <div>
                        <strong>Dry Run:</strong> {run.dry_run ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <strong>Cache Hits:</strong> {run.cache_hits}
                      </div>
                    </div>
                    
                    {run.details && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Run Details</h4>
                        {renderDetails(run.details)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}