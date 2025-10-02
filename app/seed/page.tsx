'use client'

import { useState } from 'react'

export default function SeedPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSeed = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/seed-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to seed database' })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckSales = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/sales')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to fetch sales' })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckSalesSearch = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/sales/search')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to fetch sales from search API' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Seed Tool</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleSeed}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Seeding...' : 'Seed Database'}
        </button>
        
        <button
          onClick={handleCheckSales}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Checking...' : 'Check Sales'}
        </button>
        
        <button
          onClick={handleCheckSalesSearch}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 ml-4"
        >
          {loading ? 'Checking...' : 'Check Sales Search'}
        </button>
      </div>
      
      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Result:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
