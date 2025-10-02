'use client'

import { useState } from 'react'

export default function DebugPage() {
  const [databaseStatus, setDatabaseStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [seedResult, setSeedResult] = useState<any>(null)
  const [seedLoading, setSeedLoading] = useState(false)

  const checkDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/database')
      const data = await response.json()
      setDatabaseStatus(data)
    } catch (error) {
      setDatabaseStatus({ ok: false, error: 'Failed to check database' })
    } finally {
      setLoading(false)
    }
  }

  const seedDatabase = async () => {
    setSeedLoading(true)
    try {
      const response = await fetch('/api/seed-public', { method: 'POST' })
      const data = await response.json()
      setSeedResult(data)
    } catch (error) {
      setSeedResult({ ok: false, error: 'Failed to seed database' })
    } finally {
      setSeedLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Debug</h1>
      
      <div className="space-y-6">
        {/* Database Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Database Status</h2>
          <button
            onClick={checkDatabase}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check Database'}
          </button>
          
          {databaseStatus && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Sales</h3>
                  <p>Count: {databaseStatus.sales?.count || 0}</p>
                  {databaseStatus.sales?.samples?.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <p>Sample titles:</p>
                      <ul className="list-disc list-inside">
                        {databaseStatus.sales.samples.slice(0, 3).map((sale: any, i: number) => (
                          <li key={i}>{sale.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">ZIP Codes</h3>
                  <p>Count: {databaseStatus.zipcodes?.count || 0}</p>
                  {databaseStatus.zipcodes?.samples?.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <p>Sample ZIPs:</p>
                      <ul className="list-disc list-inside">
                        {databaseStatus.zipcodes.samples.slice(0, 3).map((zip: any, i: number) => (
                          <li key={i}>{zip.zip} - {zip.city}, {zip.state}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seed Database */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Seed Database</h2>
          <button
            onClick={seedDatabase}
            disabled={seedLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {seedLoading ? 'Seeding...' : 'Seed Sales Data'}
          </button>
          
          {seedResult && (
            <div className="mt-4">
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(seedResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Check Database" to see if there are any sales in the database</li>
            <li>If sales count is 0, click "Seed Sales Data" to populate the database</li>
            <li>After seeding, go back to the sales page to see the sales</li>
            <li>If you still don't see sales, check the browser console for errors</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
