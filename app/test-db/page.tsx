'use client'

import { useState } from 'react'

export default function TestDbPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testBasicQuery = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-db')
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
      <h1 className="text-2xl font-bold mb-6">Database Connection Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={testBasicQuery}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Basic DB Query'}
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
