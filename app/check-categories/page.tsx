'use client'

import { useState } from 'react'

export default function CheckCategoriesPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-categories')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  const reseedCategories = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/seed-public', { method: 'POST' })
      const data = await response.json()
      setResult({ seedResult: data })
    } catch (error) {
      setResult({ error: 'Seed network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Check Categories Status</h1>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={checkCategories}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Categories'}
          </button>
          
          <button
            onClick={reseedCategories}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Re-seeding...' : 'Re-seed Categories'}
          </button>
        </div>
        
        {result && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Result:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
