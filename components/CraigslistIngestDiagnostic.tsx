'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface IngestRun {
  id: string
  status: 'running' | 'completed' | 'failed'
  fetched_count: number
  new_count: number
  updated_count: number
  started_at: string
  finished_at?: string
  error_message?: string
  sample_items?: Array<{
    title: string
    posted_at: string
    url: string
  }>
}

export default function CraigslistIngestDiagnostic() {
  const [lastRun, setLastRun] = useState<IngestRun | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Load last run data on mount
    loadLastRun()
  }, [])

  const loadLastRun = async () => {
    try {
      const response = await fetch('/api/ingest/status', {
        headers: {
          'X-INGEST-TOKEN': 'dev-token' // This will be replaced by server-side token
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLastRun(data)
      }
    } catch (error) {
      console.error('Failed to load last run:', error)
    }
  }

  const triggerIngest = async (dryRun: boolean) => {
    setIsRunning(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/ingest/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-INGEST-TOKEN': 'dev-token' // This will be replaced by server-side token
        },
        body: JSON.stringify({
          dryRun,
          site: 'sfbay',
          limit: 10
        })
      })

      if (response.ok) {
        const data = await response.json()
        setMessage(dryRun ? 'Dry run completed successfully' : 'Ingestion completed successfully')
        setLastRun(data)
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.message || 'Failed to trigger ingestion'}`)
      }
    } catch (error) {
      setMessage(`Network error: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'failed': return 'text-red-600'
      case 'running': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-blue-900">🔧 Craigslist Ingestion</h3>
        <Link 
          href="/_diag/ingest" 
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Full Diagnostics →
        </Link>
      </div>

      {/* Last Run Summary */}
      {lastRun ? (
        <div className="mb-4 p-3 bg-white rounded border">
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium ${getStatusColor(lastRun.status)}`}>
              Status: {lastRun.status.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600">
              {lastRun.finished_at ? formatTime(lastRun.finished_at) : formatTime(lastRun.started_at)}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Fetched:</span>
              <span className="ml-1 font-medium">{lastRun.fetched_count}</span>
            </div>
            <div>
              <span className="text-gray-600">New:</span>
              <span className="ml-1 font-medium text-green-600">{lastRun.new_count}</span>
            </div>
            <div>
              <span className="text-gray-600">Updated:</span>
              <span className="ml-1 font-medium text-blue-600">{lastRun.updated_count}</span>
            </div>
          </div>

          {lastRun.error_message && (
            <div className="mt-2 text-sm text-red-600">
              Error: {lastRun.error_message}
            </div>
          )}

          {/* Sample Items */}
          {lastRun.sample_items && lastRun.sample_items.length > 0 && (
            <div className="mt-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Recent Items:</div>
              <div className="space-y-1">
                {lastRun.sample_items.slice(0, 3).map((item, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center justify-between">
                    <span className="truncate flex-1 mr-2">{item.title}</span>
                    <span className="text-gray-400">{formatTime(item.posted_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 p-3 bg-white rounded border text-sm text-gray-600">
          No recent runs found
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => triggerIngest(true)}
          disabled={isRunning}
          className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running...' : 'Dry Run'}
        </button>
        <button
          onClick={() => triggerIngest(false)}
          disabled={isRunning}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running...' : 'Run Now'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mt-3 text-sm ${
          message.includes('Error') ? 'text-red-600' : 'text-green-600'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}
