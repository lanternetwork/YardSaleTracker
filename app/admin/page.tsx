'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowser } from '@/lib/supabase/client'

export default function AdminPage() {
  const router = useRouter()
  const [isAdminEnabled, setIsAdminEnabled] = useState(false)
  const [isPublicAdminMode, setIsPublicAdminMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [publishedCount, setPublishedCount] = useState<number | null>(null)
  const [seedResult, setSeedResult] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    // Check if admin features are enabled (client-side only)
    const checkAdminAccess = async () => {
      try {
        // Check for public admin mode first
        const publicAdminResponse = await fetch('/api/admin/public-mode')
        if (publicAdminResponse.ok) {
          const publicAdminData = await publicAdminResponse.json()
          if (publicAdminData.enabled) {
            setIsPublicAdminMode(true)
            setIsAdminEnabled(true)
            setIsLoading(false)
            return
          }
        }
        
        // Fall back to regular admin check
        const response = await fetch('/api/healthz')
        if (response.ok) {
          const data = await response.json()
          setIsAdminEnabled(data.services?.admin || false)
        }
      } catch (error) {
        console.error('Failed to check admin access:', error)
        setIsAdminEnabled(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [])

  // Fetch published sales count
  useEffect(() => {
    const fetchPublishedCount = async () => {
      try {
        const supabase = createSupabaseBrowser()
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
        
        const { count, error } = await supabase
          .from('yard_sales')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('created_at', fourteenDaysAgo.toISOString())
        
        if (error) {
          console.error('Error fetching published count:', error)
        } else {
          setPublishedCount(count || 0)
        }
      } catch (error) {
        console.error('Error fetching published count:', error)
      }
    }

    if (isAdminEnabled) {
      fetchPublishedCount()
    }
  }, [isAdminEnabled])

  const handleSeedTestSales = async () => {
    setIsSeeding(true)
    setSeedResult(null)
    
    try {
      const supabase = createSupabaseBrowser()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setSeedResult('Error: Not authenticated')
        return
      }

      const response = await fetch('/api/admin/seed/test-sales', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      
      if (response.ok) {
        setSeedResult(`✅ ${result.message}`)
        // Refresh published count
        const fourteenDaysAgo = new Date()
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
        
        const { count } = await supabase
          .from('yard_sales')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('created_at', fourteenDaysAgo.toISOString())
        
        setPublishedCount(count || 0)
      } else {
        setSeedResult(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Seed error:', error)
      setSeedResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSeeding(false)
    }
  }

  useEffect(() => {
    if (!isLoading && !isAdminEnabled) {
      router.push('/')
    }
  }, [isLoading, isAdminEnabled, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAdminEnabled) {
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
        {/* Public Admin Mode Warning Banner */}
        {isPublicAdminMode && (
          <div className="mb-6 bg-amber-100 border border-amber-300 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-amber-600 mr-3">⚠️</div>
              <div>
                <h3 className="font-semibold text-amber-800">Public Admin Mode (Preview)</h3>
                <p className="text-sm text-amber-700 mt-1">
                  This environment is running with public admin enabled (preview-only). 
                  Disable by removing ENABLE_PUBLIC_ADMIN in Vercel → Preview env.
                </p>
              </div>
            </div>
          </div>
        )}

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
                <span className="font-medium">Node:</span> {process.env.NODE_ENV || 'development'}
              </div>
              <div>
                <span className="font-medium">Vercel:</span> {process.env.VERCEL_ENV || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Admin:</span> Enabled
              </div>
              <div>
                <span className="font-medium">Diagnostics:</span> {process.env.NEXT_PUBLIC_ENABLE_DIAGNOSTICS === 'true' ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>

          {/* Service Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Services</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Supabase:</span> {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}
              </div>
              <div>
                <span className="font-medium">Maps:</span> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅' : '❌'}
              </div>
              <div>
                <span className="font-medium">Redis:</span> {process.env.UPSTASH_REDIS_REST_URL ? '✅' : '❌'}
              </div>
              <div>
                <span className="font-medium">Push:</span> {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? '✅' : '❌'}
              </div>
            </div>
          </div>

          {/* Seed Test Sales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Seed Test Sales</h2>
            <p className="text-sm text-neutral-600 mb-4">Add 2 test sales (Louisville + Oakland) for development.</p>
            <button
              onClick={handleSeedTestSales}
              disabled={isSeeding}
              className="w-full bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSeeding ? 'Seeding...' : 'Seed Test Sales'}
            </button>
            {seedResult && (
              <div className="mt-3 text-sm p-2 bg-neutral-100 rounded">
                {seedResult}
              </div>
            )}
          </div>

          {/* Wizard Debug */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Wizard Debug</h2>
            <p className="text-sm text-neutral-600 mb-4">Monitor posting wizard usage and dedupe effectiveness.</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Published sales (last 14 days):</span>
                <span className="font-medium">{publishedCount !== null ? publishedCount : 'Loading...'}</span>
              </div>
              <div className="flex justify-between">
                <span>Drafts (last 7 days):</span>
                <span className="font-medium">-</span>
              </div>
              <div className="flex justify-between">
                <span>Negative matches:</span>
                <span className="font-medium">-</span>
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
