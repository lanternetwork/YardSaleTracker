'use client'
import { useEffect, useState } from 'react'
import { createSupabaseBrowser } from '@/lib/supabase/client'

export default function SupabaseClientTest() {
  const [clientTest, setClientTest] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testSupabaseClient = async () => {
    setIsLoading(true)
    
    try {
      // Test client creation
      const supabase = createSupabaseBrowser()
      
      const result = {
        clientCreated: true,
        clientUrl: supabase.supabaseUrl,
        clientKey: supabase.supabaseKey?.substring(0, 20) + '...',
        tests: {} as any
      }

      // Test 1: Simple connection test
      try {
        const { data, error } = await supabase.from('yard_sales').select('count').limit(1)
        result.tests.connectionTest = {
          success: !error,
          error: error?.message,
          data: data
        }
      } catch (err: any) {
        result.tests.connectionTest = {
          success: false,
          error: err.message,
          type: err.name
        }
      }

      // Test 2: RPC function test
      try {
        const { data, error } = await supabase.rpc('search_sales', {
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
        result.tests.rpcTest = {
          success: !error,
          error: error?.message,
          data: data
        }
      } catch (err: any) {
        result.tests.rpcTest = {
          success: false,
          error: err.message,
          type: err.name
        }
      }

      // Test 3: Auth test
      try {
        const { data, error } = await supabase.auth.getUser()
        result.tests.authTest = {
          success: !error,
          error: error?.message,
          data: data
        }
      } catch (err: any) {
        result.tests.authTest = {
          success: false,
          error: err.message,
          type: err.name
        }
      }

      setClientTest(result)
    } catch (err: any) {
      setClientTest({
        clientCreated: false,
        error: err.message,
        type: err.name
      })
    }
    
    setIsLoading(false)
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-green-800 font-medium">🔧 Supabase Client Test</h3>
        <button
          onClick={testSupabaseClient}
          disabled={isLoading}
          className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test Supabase Client'}
        </button>
      </div>
      
      {clientTest && (
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-green-800 mb-2">Client Creation</h4>
            <div className="text-sm">
              {clientTest.clientCreated ? (
                <div className="text-green-600">
                  <div>✅ Client created successfully</div>
                  <div>URL: {clientTest.clientUrl}</div>
                  <div>Key: {clientTest.clientKey}</div>
                </div>
              ) : (
                <div className="text-red-600">
                  <div>❌ Client creation failed</div>
                  <div>Error: {clientTest.error}</div>
                  <div>Type: {clientTest.type}</div>
                </div>
              )}
            </div>
          </div>

          {clientTest.tests && (
            <div>
              <h4 className="font-medium text-green-800 mb-2">Client Tests</h4>
              <div className="text-sm space-y-2">
                <div>
                  <strong>Connection Test:</strong> {clientTest.tests.connectionTest?.success ? '✅' : '❌'}
                  {clientTest.tests.connectionTest?.error && (
                    <div className="text-red-600 ml-4">Error: {clientTest.tests.connectionTest.error}</div>
                  )}
                </div>
                <div>
                  <strong>RPC Test:</strong> {clientTest.tests.rpcTest?.success ? '✅' : '❌'}
                  {clientTest.tests.rpcTest?.error && (
                    <div className="text-red-600 ml-4">Error: {clientTest.tests.rpcTest.error}</div>
                  )}
                </div>
                <div>
                  <strong>Auth Test:</strong> {clientTest.tests.authTest?.success ? '✅' : '❌'}
                  {clientTest.tests.authTest?.error && (
                    <div className="text-red-600 ml-4">Error: {clientTest.tests.authTest.error}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
