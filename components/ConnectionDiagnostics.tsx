'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'pending'
  message: string
  details?: any
}

export default function ConnectionDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    setDiagnostics([])
    
    const sb = createSupabaseBrowser()
    const results: DiagnosticResult[] = []

    // Test 1: Environment Variables
    results.push({
      test: 'Environment Variables',
      status: 'pending',
      message: 'Checking environment configuration...'
    })
    setDiagnostics([...results])

    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
    const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'

    results[0] = {
      test: 'Environment Variables',
      status: hasSupabaseUrl && hasSupabaseKey ? 'success' : 'error',
      message: hasSupabaseUrl && hasSupabaseKey 
        ? 'Environment variables are configured' 
        : `Missing: ${!hasSupabaseUrl ? 'SUPABASE_URL ' : ''}${!hasSupabaseKey ? 'SUPABASE_KEY' : ''}`,
      details: {
        url: hasSupabaseUrl,
        key: hasSupabaseKey
      }
    }
    setDiagnostics([...results])

    if (!hasSupabaseUrl || !hasSupabaseKey) {
      setIsRunning(false)
      return
    }

    // Test 2: Supabase Connection
    results.push({
      test: 'Supabase Connection',
      status: 'pending',
      message: 'Testing connection to Supabase...'
    })
    setDiagnostics([...results])

    try {
      const { data, error } = await sb.from('yard_sales').select('count').limit(1)
      results[1] = {
        test: 'Supabase Connection',
        status: error ? 'error' : 'success',
        message: error ? `Connection failed: ${error.message}` : 'Successfully connected to Supabase',
        details: { error: error?.message }
      }
    } catch (err: any) {
      results[1] = {
        test: 'Supabase Connection',
        status: 'error',
        message: `Connection error: ${err.message}`,
        details: { error: err.message }
      }
    }
    setDiagnostics([...results])

    // Test 3: RPC Function
    results.push({
      test: 'RPC Function',
      status: 'pending',
      message: 'Testing search_sales RPC function...'
    })
    setDiagnostics([...results])

    try {
      const { data, error } = await sb.rpc('search_sales', {
        search_query: null,
        max_distance_km: null,
        user_lat: null,
        user_lng: null,
        date_from: null,
        date_to: null,
        price_min: null,
        price_max: null,
        tags_filter: null,
        limit_count: 1,
        offset_count: 0
      })
      
      results[2] = {
        test: 'RPC Function',
        status: error ? 'error' : 'success',
        message: error ? `RPC failed: ${error.message}` : 'RPC function is available',
        details: { error: error?.message, dataCount: data?.length }
      }
    } catch (err: any) {
      results[2] = {
        test: 'RPC Function',
        status: 'error',
        message: `RPC error: ${err.message}`,
        details: { error: err.message }
      }
    }
    setDiagnostics([...results])

    // Test 4: Direct Table Query
    results.push({
      test: 'Direct Table Query',
      status: 'pending',
      message: 'Testing direct table access...'
    })
    setDiagnostics([...results])

    try {
      const { data, error } = await sb.from('yard_sales').select('id, title').limit(5)
      results[3] = {
        test: 'Direct Table Query',
        status: error ? 'error' : 'success',
        message: error ? `Table query failed: ${error.message}` : `Found ${data?.length || 0} sales`,
        details: { error: error?.message, count: data?.length }
      }
    } catch (err: any) {
      results[3] = {
        test: 'Direct Table Query',
        status: 'error',
        message: `Table query error: ${err.message}`,
        details: { error: err.message }
      }
    }
    setDiagnostics([...results])

    setIsRunning(false)
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-blue-800 font-medium">Connection Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run Diagnostics'}
        </button>
      </div>
      
      {diagnostics.length > 0 && (
        <div className="space-y-2">
          {diagnostics.map((result, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                result.status === 'success' ? 'bg-green-500' :
                result.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`} />
              <div className="flex-1">
                <div className="font-medium text-sm">{result.test}</div>
                <div className="text-xs text-gray-600">{result.message}</div>
                {result.details && (
                  <details className="mt-1">
                    <summary className="text-xs text-gray-500 cursor-pointer">Details</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
