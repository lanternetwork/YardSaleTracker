'use client'
import React, { useState } from 'react'
import { useCreateSale } from '@/lib/hooks/useSales'
import { geocodeAddress } from '@/lib/geocode'
import CSVImportExport from './CSVImportExport'

interface ScrapedSale {
  id: string
  title: string
  description?: string
  address?: string
  start_at?: string
  end_at?: string
  // (deprecated; yard sales do not have sale-level prices)
  contact?: string
  source: string
  url?: string
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
  { value: 'boston', label: 'Boston' },
  { value: 'newyork', label: 'New York' }
]

export default function ImportSales() {
  const createSale = useCreateSale()
  const [city, setCity] = useState('sfbay')
  const [query, setQuery] = useState('garage sale')
  const [scrapedSales, setScrapedSales] = useState<ScrapedSale[]>([])
  const [selectedSales, setSelectedSales] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'craigslist' | 'csv'>('craigslist')

  // Check if admin features are enabled
  if (process.env.ENABLE_ADMIN !== 'true') {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Import Features Disabled</h2>
        <p className="text-neutral-600">
          Import features are currently disabled. Contact an administrator for access.
        </p>
      </div>
    )
  }

  const handleScrape = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, query })
      })
      
      if (!response.ok) {
        throw new Error('Failed to scrape Craigslist')
      }
      
      const data = await response.json()
      setScrapedSales(data.sales || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scraping failed')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (selectedSales.size === 0) return
    
    setImporting(true)
    setError(null)
    
    try {
      const selectedSalesList = Array.from(selectedSales).map(i => scrapedSales[i])
      
      for (const sale of selectedSalesList) {
        try {
          // Geocode address if available
          let lat, lng
          if (sale.address) {
            const geocoded = await geocodeAddress(sale.address)
            if (geocoded) {
              lat = geocoded.lat
              lng = geocoded.lng
            }
          }
          
          // Create sale
          await createSale.mutateAsync({
            title: sale.title,
            description: sale.description,
            address: sale.address,
            lat,
            lng,
            start_at: sale.start_at,
            end_at: sale.end_at,
            // (deprecated; yard sales do not have sale-level prices)
            contact: sale.contact,
            source: sale.source,
            source_id: sale.id,
            url: sale.url
          })
        } catch (err) {
          console.error('Failed to import sale:', err)
        }
      }
      
      // Clear selections
      setSelectedSales(new Set())
      setScrapedSales([])
      
      alert(`Successfully imported ${selectedSalesList.length} sales!`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
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
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-8">
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
            CSV Import
          </button>
        </nav>
      </div>

      {activeTab === 'csv' && <CSVImportExport />}

      {activeTab === 'craigslist' && (
        <div>
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
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              {error}
            </div>
          )}

          {/* Results */}
          {scrapedSales.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Found {scrapedSales.length} sales</h3>
              <div className="space-y-4">
                {scrapedSales.map((sale, index) => (
                  <div key={index} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg mb-2">{sale.title}</h4>
                        {sale.description && (
                          <p className="text-sm text-neutral-600 mb-2">{sale.description}</p>
                        )}
                        <div className="text-sm text-neutral-500 space-y-1">
                          {sale.address && <div>📍 {sale.address}</div>}
                          {sale.start_at && <div>📅 {sale.start_at}</div>}
                          {/* (deprecated; yard sales do not have sale-level prices) */}
                          {sale.contact && <div>📞 {sale.contact}</div>}
                          {sale.url && (
                            <div>
                              <a href={sale.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                View on Craigslist →
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedSales.has(index)}
                            onChange={e => {
                              const newSelected = new Set(selectedSales)
                              if (e.target.checked) {
                                newSelected.add(index)
                              } else {
                                newSelected.delete(index)
                              }
                              setSelectedSales(newSelected)
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">Select</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedSales.size > 0 && (
                <div className="mt-6 flex gap-4">
                  <button
                    onClick={handleImport}
                    disabled={importing}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? 'Importing...' : `Import ${selectedSales.size} sales`}
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedSales(new Set())
                      setScrapedSales([])
                    }}
                    className="bg-neutral-500 text-white px-6 py-2 rounded hover:bg-neutral-600"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}