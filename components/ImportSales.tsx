'use client'
import React, { useState } from 'react'
import { useCreateSale } from '@/lib/hooks/useSales'
import { geocodeAddress } from '@/lib/geocode'
import CSVImportExport from './CSVImportExport'
import { config } from '@/lib/config/env'

interface ScrapedSale {
  id: string
  title: string
  description?: string
  address?: string
  start_at?: string
  end_at?: string
  price_min?: number
  price_max?: number
  contact?: string
  source: string
  url?: string
}

export default function ImportSales() {
  const createSale = useCreateSale()
  const [city, setCity] = useState('sfbay')
  const [query, setQuery] = useState('garage sale')
  const [scrapedSales, setScrapedSales] = useState<ScrapedSale[]>([])
  const [selectedSales, setSelectedSales] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'craigslist' | 'csv'>('craigslist')

  // Check if admin features are enabled
  if (!config.features.admin) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Import Features Disabled</h2>
        <p className="text-neutral-600">
          Import features are currently disabled. Contact an administrator for access.
        </p>
      </div>
    )
  }

  const cities = [
    { value: 'sfbay', label: 'San Francisco Bay Area' },
    { value: 'seattle', label: 'Seattle' },
    { value: 'portland', label: 'Portland' },
    { value: 'losangeles', label: 'Los Angeles' },
    { value: 'sandiego', label: 'San Diego' },
    { value: 'phoenix', label: 'Phoenix' },
    { value: 'denver', label: 'Denver' },
    { value: 'chicago', label: 'Chicago' },
    { value: 'atlanta', label: 'Atlanta' },
    { value: 'miami', label: 'Miami' },
    { value: 'boston', label: 'Boston' },
    { value: 'newyork', label: 'New York' }
  ]

  const handleScrape = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ city, query })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scrape data')
      }

      setScrapedSales(data.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape data')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSale = (saleId: string) => {
    const newSelected = new Set(selectedSales)
    if (newSelected.has(saleId)) {
      newSelected.delete(saleId)
    } else {
      newSelected.add(saleId)
    }
    setSelectedSales(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedSales.size === scrapedSales.length) {
      setSelectedSales(new Set())
    } else {
      setSelectedSales(new Set(scrapedSales.map(s => s.id)))
    }
  }

  const handleImport = async () => {
    if (selectedSales.size === 0) return

    setImporting(true)
    setError(null)

    try {
      const salesToImport = scrapedSales.filter(s => selectedSales.has(s.id))
      
      // Process each sale
      for (const sale of salesToImport) {
        try {
          // Try to geocode the address if available
          let lat: number | undefined
          let lng: number | undefined
          
          if (sale.address) {
            const geocodeResult = await geocodeAddress(sale.address)
            if (geocodeResult) {
              lat = geocodeResult.lat
              lng = geocodeResult.lng
            }
          }

          await createSale.mutateAsync({
            title: sale.title,
            description: sale.description,
            address: sale.address,
            start_at: sale.start_at,
            end_at: sale.end_at,
            price_min: sale.price_min,
            price_max: sale.price_max,
            contact: sale.contact,
            lat,
            lng,
            tags: [],
            photos: [],
            source: sale.source
          })
        } catch (err) {
          console.error('Failed to import sale:', sale.title, err)
        }
      }

      // Clear selections and show success
      setSelectedSales(new Set())
      alert(`Successfully imported ${salesToImport.length} sales!`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import sales')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Import Sales</h2>
        <p className="text-neutral-600 mb-6">
          Import sales from external sources or CSV files.
        </p>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('craigslist')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'craigslist'
              ? 'border-b-2 border-amber-500 text-amber-600'
              : 'text-neutral-600 hover:text-neutral-800'
          }`}
        >
          Craigslist Scraper
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'csv'
              ? 'border-b-2 border-amber-500 text-amber-600'
              : 'text-neutral-600 hover:text-neutral-800'
          }`}
        >
          CSV Import/Export
        </button>
      </div>

      {activeTab === 'csv' && <CSVImportExport />}

      {activeTab === 'craigslist' && (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-2">Import Sales from Craigslist</h3>
            <p className="text-neutral-600 mb-4">
              Search for yard sales on Craigslist and import them to your local database.
            </p>
          </div>

          {/* Search form */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              {cities.map(c => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Search Query</label>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="garage sale, estate sale, etc."
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleScrape}
              disabled={loading}
              className="w-full px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Craigslist'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {scrapedSales.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Found {scrapedSales.length} sales
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleSelectAll}
                className="px-3 py-1 text-sm border rounded hover:bg-neutral-100"
              >
                {selectedSales.size === scrapedSales.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={handleImport}
                disabled={selectedSales.size === 0 || importing}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Importing...' : `Import ${selectedSales.size} Selected`}
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {scrapedSales.map(sale => (
              <div
                key={sale.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSales.has(sale.id)
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                onClick={() => handleSelectSale(sale.id)}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedSales.has(sale.id)}
                    onChange={() => handleSelectSale(sale.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{sale.title}</h4>
                    {sale.description && (
                      <p className="text-neutral-600 text-sm mt-1">{sale.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-neutral-500">
                      {sale.address && <span>📍 {sale.address}</span>}
                      {sale.start_at && (
                        <span>📅 {new Date(sale.start_at).toLocaleDateString()}</span>
                      )}
                      {(sale.price_min || sale.price_max) && (
                        <span>
                          💰 ${sale.price_min || 0} - ${sale.price_max || '∞'}
                        </span>
                      )}
                      {sale.url && (
                        <a
                          href={sale.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-600 hover:text-amber-700"
                          onClick={e => e.stopPropagation()}
                        >
                          View on Craigslist →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
      )}
    </div>
  )
}
