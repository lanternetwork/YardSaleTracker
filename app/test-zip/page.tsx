'use client'

import { useState } from 'react'

export default function TestZipPage() {
  const [zip, setZip] = useState('30309')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testZip = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/geocoding/zip?zip=${zip}`)
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test ZIP Lookup</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">ZIP Code</label>
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter ZIP code"
          />
        </div>
        
        <button
          onClick={testZip}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test ZIP Lookup'}
        </button>
        
        {result && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
