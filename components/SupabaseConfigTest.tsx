'use client'
import { useEffect, useState } from 'react'

export default function SupabaseConfigTest() {
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testSupabaseConfig = async () => {
    setIsLoading(true)
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const result = {
      url: supabaseUrl,
      key: supabaseKey?.substring(0, 20) + '...',
      urlValid: supabaseUrl?.includes('supabase.co'),
      keyValid: supabaseKey?.startsWith('eyJ'),
      testFetch: null as any
    }

    // Test direct fetch to Supabase
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey!,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      result.testFetch = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      }
    } catch (err: any) {
      result.testFetch = {
        error: err.message,
        type: err.name
      }
    }

    setTestResult(result)
    setIsLoading(false)
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-red-800 font-medium">🔧 Supabase Configuration Test</h3>
        <button
          onClick={testSupabaseConfig}
          disabled={isLoading}
          className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Supabase Config'}
        </button>
      </div>
      
      {testResult && (
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-red-800 mb-2">Configuration</h4>
            <div className="text-sm space-y-1">
              <div>URL: {testResult.url}</div>
              <div>Key: {testResult.key}</div>
              <div>URL Valid: {testResult.urlValid ? '✅' : '❌'}</div>
              <div>Key Valid: {testResult.keyValid ? '✅' : '❌'}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-red-800 mb-2">Direct Fetch Test</h4>
            <div className="text-sm">
              {testResult.testFetch?.error ? (
                <div className="text-red-600">
                  <div>Error: {testResult.testFetch.error}</div>
                  <div>Type: {testResult.testFetch.type}</div>
                </div>
              ) : (
                <div className="text-green-600">
                  <div>Status: {testResult.testFetch?.status}</div>
                  <div>OK: {testResult.testFetch?.ok ? '✅' : '❌'}</div>
                  <div>Status Text: {testResult.testFetch?.statusText}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
