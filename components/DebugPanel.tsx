'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'

interface DebugInfo {
  environment: {
    supabaseUrl: string
    supabaseKey: string
    googleMaps: string
    siteUrl: string
  }
  database: {
    connection: boolean
    tables: string[]
    salesCount: number
    favoritesCount: number
  }
  errors: string[]
}

export default function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDebugCheck = async () => {
    setIsLoading(true)
    const errors: string[] = []
    
    // Check environment variables
    const environment = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'NOT SET',
      googleMaps: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'NOT SET',
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'NOT SET'
    }

    // Check database connection
    let connection = false
    let tables: string[] = []
    let salesCount = 0
    let favoritesCount = 0

    try {
      const supabase = createSupabaseBrowser()
      
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('yard_sales')
        .select('count')
        .limit(1)
      
      if (connectionError) {
        errors.push(`Database connection failed: ${connectionError.message}`)
      } else {
        connection = true
      }

      // Check if yard_sales table exists and has data
      const { data: salesData, error: salesError } = await supabase
        .from('yard_sales')
        .select('id')
        .limit(10)
      
      if (salesError) {
        errors.push(`Yard sales table error: ${salesError.message}`)
      } else {
        salesCount = salesData?.length || 0
        tables.push('yard_sales')
      }

      // Check if favorites table exists
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('id')
        .limit(10)
      
      if (favoritesError) {
        errors.push(`Favorites table error: ${favoritesError.message}`)
      } else {
        favoritesCount = favoritesData?.length || 0
        tables.push('favorites')
      }

      // Check for other common tables
      const commonTables = ['sale_items', 'profiles']
      for (const table of commonTables) {
        try {
          const { error } = await supabase.from(table).select('id').limit(1)
          if (!error) {
            tables.push(table)
          }
        } catch (err) {
          // Table doesn't exist, that's okay
        }
      }

    } catch (err: any) {
      errors.push(`Database check failed: ${err.message}`)
    }

    setDebugInfo({
      environment,
      database: {
        connection,
        tables,
        salesCount,
        favoritesCount
      },
      errors
    })
    setIsLoading(false)
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-blue-800 font-medium">Debug Information</h3>
        <button
          onClick={runDebugCheck}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
        >
          {isLoading ? 'Checking...' : 'Run Debug Check'}
        </button>
      </div>
      
      {debugInfo && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Environment Variables</h4>
            <div className="text-sm space-y-1">
              <div>Supabase URL: {debugInfo.environment.supabaseUrl.substring(0, 30)}...</div>
              <div>Supabase Key: {debugInfo.environment.supabaseKey.substring(0, 20)}...</div>
              <div>Google Maps: {debugInfo.environment.googleMaps.substring(0, 20)}...</div>
              <div>Site URL: {debugInfo.environment.siteUrl}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-blue-800 mb-2">Database Status</h4>
            <div className="text-sm space-y-1">
              <div>Connection: {debugInfo.database.connection ? '✅ Connected' : '❌ Failed'}</div>
              <div>Tables Found: {debugInfo.database.tables.join(', ') || 'None'}</div>
              <div>Sales Count: {debugInfo.database.salesCount}</div>
              <div>Favorites Count: {debugInfo.database.favoritesCount}</div>
            </div>
          </div>

          {debugInfo.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-red-800 mb-2">Errors Found</h4>
              <div className="text-sm space-y-1">
                {debugInfo.errors.map((error, index) => (
                  <div key={index} className="text-red-600">• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
