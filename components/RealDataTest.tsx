'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'

interface TestResult {
  rpcTest: {
    success: boolean
    data: any
    error: string | null
  }
  directTest: {
    success: boolean
    data: any
    error: string | null
  }
  favoritesTest: {
    success: boolean
    data: any
    error: string | null
  }
}

export default function RealDataTest() {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runRealDataTest = async () => {
    setIsLoading(true)
    
    const supabase = createSupabaseBrowser()
    const result: TestResult = {
      rpcTest: { success: false, data: null, error: null },
      directTest: { success: false, data: null, error: null },
      favoritesTest: { success: false, data: null, error: null }
    }

    // Test 1: RPC function
    try {
      const { data, error } = await supabase.rpc('search_sales', {
        p_search_query: null,
        p_max_distance_km: null,
        p_user_lat: null,
        p_user_lng: null,
        p_date_from: null,
        p_date_to: null,
        p_price_min: null,
        p_price_max: null,
        p_tags_filter: null,
        p_limit_count: 5,
        p_offset_count: 0
      })
      
      result.rpcTest = {
        success: !error,
        data: data,
        error: error?.message || null
      }
    } catch (err: any) {
      result.rpcTest = {
        success: false,
        data: null,
        error: err.message
      }
    }

    // Test 2: Direct table query
    try {
      const { data, error } = await supabase
        .from('yard_sales')
        .select('*')
        .limit(5)
      
      result.directTest = {
        success: !error,
        data: data,
        error: error?.message || null
      }
    } catch (err: any) {
      result.directTest = {
        success: false,
        data: null,
        error: err.message
      }
    }

    // Test 3: Favorites table
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .limit(5)
      
      result.favoritesTest = {
        success: !error,
        data: data,
        error: error?.message || null
      }
    } catch (err: any) {
      result.favoritesTest = {
        success: false,
        data: null,
        error: err.message
      }
    }

    setTestResult(result)
    setIsLoading(false)
  }

  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-purple-800 font-medium">Real Data Connection Test</h3>
        <button
          onClick={runRealDataTest}
          disabled={isLoading}
          className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-sm hover:bg-purple-200 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Real Connection'}
        </button>
      </div>
      
      {testResult && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-purple-800 mb-2">RPC Function Test</h4>
            <div className={`p-2 rounded text-sm ${
              testResult.rpcTest.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {testResult.rpcTest.success ? '✅ Success' : '❌ Failed'}
              {testResult.rpcTest.error && <div className="mt-1">Error: {testResult.rpcTest.error}</div>}
              {testResult.rpcTest.data && <div className="mt-1">Data: {JSON.stringify(testResult.rpcTest.data).substring(0, 100)}...</div>}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-purple-800 mb-2">Direct Table Test</h4>
            <div className={`p-2 rounded text-sm ${
              testResult.directTest.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {testResult.directTest.success ? '✅ Success' : '❌ Failed'}
              {testResult.directTest.error && <div className="mt-1">Error: {testResult.directTest.error}</div>}
              {testResult.directTest.data && <div className="mt-1">Data: {JSON.stringify(testResult.directTest.data).substring(0, 100)}...</div>}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-purple-800 mb-2">Favorites Table Test</h4>
            <div className={`p-2 rounded text-sm ${
              testResult.favoritesTest.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {testResult.favoritesTest.success ? '✅ Success' : '❌ Failed'}
              {testResult.favoritesTest.error && <div className="mt-1">Error: {testResult.favoritesTest.error}</div>}
              {testResult.favoritesTest.data && <div className="mt-1">Data: {JSON.stringify(testResult.favoritesTest.data).substring(0, 100)}...</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
