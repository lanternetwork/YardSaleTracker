'use client'

import { useState, useEffect } from 'react'

export default function TestZipcodesPage() {
  const [zipcodes, setZipcodes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedResult, setSeedResult] = useState<any>(null)
  const [zipLookup, setZipLookup] = useState('')
  const [lookupResult, setLookupResult] = useState<any>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  const fetchZipcodes = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/zipcodes?limit=5')
      const data = await response.json()
      
      if (data.ok) {
        setZipcodes(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch ZIP codes')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const seedZipcodes = async () => {
    setSeedLoading(true)
    setSeedResult(null)
    
    try {
      const response = await fetch('/api/admin/seed/zipcodes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SEED_TOKEN || 'lootaura_ingest_8nZ3tYq4Jm2Kb1Rp7Vx6Wc9uD5a0Ls3f'}`,
          'Content-Type': 'application/json'
        }
      })
      
      const data = await response.json()
      setSeedResult(data)
    } catch (err) {
      setSeedResult({ ok: false, error: 'Network error' })
    } finally {
      setSeedLoading(false)
    }
  }

  const lookupZip = async () => {
    if (!zipLookup || !/^\d{5}$/.test(zipLookup)) {
      setLookupResult({ ok: false, error: 'Please enter a valid 5-digit ZIP code' })
      return
    }
    
    setLookupLoading(true)
    setLookupResult(null)
    
    try {
      const response = await fetch(`/api/geocoding/zip?zip=${zipLookup}`)
      const data = await response.json()
      setLookupResult(data)
    } catch (err) {
      setLookupResult({ ok: false, error: 'Network error' })
    } finally {
      setLookupLoading(false)
    }
  }

  useEffect(() => {
    fetchZipcodes()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ZIP Codes Table Test</h1>
      
      <div className="mb-6 space-y-4">
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={fetchZipcodes}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh ZIP Codes'}
          </button>
          
          <button
            onClick={seedZipcodes}
            disabled={seedLoading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {seedLoading ? 'Seeding...' : 'Seed ZIP Codes (Admin)'}
          </button>
        </div>
        
        <div className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test ZIP Lookup
            </label>
            <input
              type="text"
              value={zipLookup}
              onChange={(e) => setZipLookup(e.target.value)}
              placeholder="Enter 5-digit ZIP (e.g., 90210)"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={5}
            />
          </div>
          <button
            onClick={lookupZip}
            disabled={lookupLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {lookupLoading ? 'Looking up...' : 'Lookup ZIP'}
          </button>
        </div>
        
        {seedResult && (
          <div className={`p-4 rounded ${seedResult.ok ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
            <h3 className="font-bold">Seed Result:</h3>
            <pre className="mt-2 text-sm">{JSON.stringify(seedResult, null, 2)}</pre>
          </div>
        )}
        
        {lookupResult && (
          <div className={`p-4 rounded ${lookupResult.ok ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
            <h3 className="font-bold">ZIP Lookup Result:</h3>
            <pre className="mt-2 text-sm">{JSON.stringify(lookupResult, null, 2)}</pre>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {zipcodes.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ZIP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Latitude
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Longitude
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zipcodes.map((zipcode, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {zipcode.zip}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {zipcode.city || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {zipcode.state || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {zipcode.lat?.toFixed(6) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {zipcode.lng?.toFixed(6) || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          No ZIP codes found. The table may be empty or not accessible.
        </div>
      )}
    </div>
  )
}