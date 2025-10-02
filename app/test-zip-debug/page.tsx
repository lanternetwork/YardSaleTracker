'use client'

import { useState } from 'react'

export default function ZipDebugPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const testZipCodes = async () => {
    setLoading(true)
    setResults([])
    
    const testCases = [
      '40204', '78723', '97211', '98107', '85018', 
      '92104', '11103', '02115', '00501',
      '2115', '501', '123456789', 'abc123def', '123-45'
    ]
    
    const newResults = []
    
    for (const zip of testCases) {
      try {
        const response = await fetch(`/api/geocoding/zip?zip=${encodeURIComponent(zip)}`)
        const data = await response.json()
        
        newResults.push({
          input: zip,
          result: data,
          status: data.ok ? 'success' : 'error'
        })
      } catch (error) {
        newResults.push({
          input: zip,
          result: { error: error instanceof Error ? error.message : String(error) },
          status: 'network_error'
        })
      }
    }
    
    setResults(newResults)
    setLoading(false)
  }

  const checkTableCount = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/zipcodes?limit=1')
      const data = await response.json()
      
      if (data.ok) {
        setResults([{
          input: 'Table Count Check',
          result: { message: `Found ${data.data?.length || 0} records (limited to 1 for display)` },
          status: 'info'
        }])
      } else {
        setResults([{
          input: 'Table Count Check',
          result: { error: data.error },
          status: 'error'
        }])
      }
    } catch (error) {
      setResults([{
        input: 'Table Count Check',
        result: { error: error instanceof Error ? error.message : String(error) },
        status: 'network_error'
      }])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ZIP Codes Debug</h1>
      
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <button
            onClick={checkTableCount}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Table Count'}
          </button>
          
          <button
            onClick={testZipCodes}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test ZIP Codes'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Results</h2>
          {results.map((result, index) => (
            <div key={index} className={`p-4 rounded border ${
              result.status === 'success' ? 'bg-green-50 border-green-200' :
              result.status === 'error' ? 'bg-red-50 border-red-200' :
              result.status === 'network_error' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Input: "{result.input}"</h3>
                  <div className="mt-2">
                    <pre className="text-sm bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'success' ? 'bg-green-100 text-green-800' :
                  result.status === 'error' ? 'bg-red-100 text-red-800' :
                  result.status === 'network_error' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {result.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
