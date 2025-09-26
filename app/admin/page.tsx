'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { config } from '@/lib/config/env'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if admin features are enabled
    if (!config.features.admin) {
      router.push('/')
    }
  }, [router])

  if (!config.features.admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-neutral-600">Admin features are not enabled.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-neutral-600">System diagnostics and administrative tools.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Health Check */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">System Health</h2>
            <p className="text-sm text-neutral-600 mb-4">Check system status and connectivity.</p>
            <a
              href="/api/healthz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              View Health Status
            </a>
          </div>

          {/* Ingestion Diagnostics */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Ingestion</h2>
            <p className="text-sm text-neutral-600 mb-4">Monitor Craigslist data ingestion.</p>
            <a
              href="/diagnostics/ingest"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              View Ingestion Status
            </a>
          </div>

          {/* Debug Console */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Debug Console</h2>
            <p className="text-sm text-neutral-600 mb-4">Step-by-step ingestion debugging.</p>
            <a
              href="/diagnostics/ingest/console"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              Open Debug Console
            </a>
          </div>

          {/* Environment Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Environment</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Node:</span> {config.server.NODE_ENV}
              </div>
              <div>
                <span className="font-medium">Vercel:</span> {config.server.VERCEL_ENV || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Admin:</span> {config.features.admin ? 'Enabled' : 'Disabled'}
              </div>
              <div>
                <span className="font-medium">Diagnostics:</span> {config.features.diagnostics ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Services</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Supabase:</span> {config.services.supabase ? '✅' : '❌'}
              </div>
              <div>
                <span className="font-medium">Maps:</span> {config.services.maps ? '✅' : '❌'}
              </div>
              <div>
                <span className="font-medium">Redis:</span> {config.services.redis ? '✅' : '❌'}
              </div>
              <div>
                <span className="font-medium">Push:</span> {config.services.push ? '✅' : '❌'}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <a
                href="/.github/workflows/ingest-craigslist-backup.yml"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                View Backup Workflow
              </a>
              <a
                href="/docs/ENVIRONMENT_BASELINE.md"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-blue-600 hover:text-blue-800"
              >
                Environment Documentation
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
