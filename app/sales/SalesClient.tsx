'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sale } from '@/lib/data'
import SalesMap from '@/components/location/SalesMap'
import UseLocationButton from '@/components/location/UseLocationButton'
import { useLocationSearch } from '@/lib/location/useLocation'

interface SalesClientProps {
  initialSales: Sale[]
  initialFilters: {
    lat?: number
    lng?: number
    distance: number
    city: string
    categories: string[]
    query: string
  }
}

export default function SalesClient({ initialSales, initialFilters }: SalesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { location, searchWithLocation, setSearchRadius } = useLocationSearch()
  
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [filters, setFilters] = useState(initialFilters)

  // Update search when location changes
  useEffect(() => {
    if (location) {
      handleLocationSearch()
    }
  }, [location])

  const handleLocationSearch = async () => {
    if (!location) return

    setLoading(true)
    try {
      const results = await searchWithLocation(async ({ lat, lng, distanceKm }) => {
        const params = new URLSearchParams()
        params.set('lat', lat.toString())
        params.set('lng', lng.toString())
        params.set('distance', distanceKm.toString())
        
        if (filters.city) params.set('city', filters.city)
        if (filters.categories.length > 0) params.set('categories', filters.categories.join(','))
        if (filters.query) params.set('q', filters.query)

        const response = await fetch(`/api/sales/search?${params.toString()}`)
        if (!response.ok) throw new Error('Search failed')
        
        return response.json()
      })

      setSales(results)
      updateURL({ lat: location.lat, lng: location.lng, distance: filters.distance })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (params: { lat?: number; lng?: number; distance?: number; city?: string; categories?: string[]; query?: string }) => {
    const newParams = new URLSearchParams(searchParams.toString())
    
    if (params.lat !== undefined) newParams.set('lat', params.lat.toString())
    if (params.lng !== undefined) newParams.set('lng', params.lng.toString())
    if (params.distance !== undefined) newParams.set('distance', params.distance.toString())
    if (params.city !== undefined) {
      if (params.city) newParams.set('city', params.city)
      else newParams.delete('city')
    }
    if (params.categories !== undefined) {
      if (params.categories.length > 0) newParams.set('categories', params.categories.join(','))
      else newParams.delete('categories')
    }
    if (params.query !== undefined) {
      if (params.query) newParams.set('q', params.query)
      else newParams.delete('q')
    }

    router.push(`/sales?${newParams.toString()}`)
  }

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setSearchRadius(25) // Reset to default distance
    setFilters(prev => ({ ...prev, lat: location.lat, lng: location.lng, distance: 25 }))
    updateURL({ lat: location.lat, lng: location.lng, distance: 25 })
  }

  const handleDistanceChange = (distance: number) => {
    setFilters(prev => ({ ...prev, distance }))
    if (location) {
      updateURL({ lat: location.lat, lng: location.lng, distance })
    }
  }

  const handleCityChange = (city: string) => {
    setFilters(prev => ({ ...prev, city }))
    updateURL({ city: city || undefined })
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    
    setFilters(prev => ({ ...prev, categories: newCategories }))
    updateURL({ categories: newCategories.length > 0 ? newCategories : undefined })
  }

  const handleQueryChange = (query: string) => {
    setFilters(prev => ({ ...prev, query }))
    updateURL({ query: query || undefined })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getPriceDisplay = (price?: number) => {
    if (price === null || price === undefined) return 'Free'
    if (price === 0) return 'Free'
    return `$${price.toLocaleString()}`
  }

  const currentCenter = location || { lat: 38.2527, lng: -85.7585 }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Sales</h1>
        
        {/* Search Bar */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search sales, items, or locations..."
              value={filters.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden inline-flex items-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px]"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
        </div>

        {/* Desktop Filters */}
        <div className="hidden md:flex gap-4 mb-6">
          <UseLocationButton
            onLocationUpdate={handleLocationUpdate}
            variant="outline"
            size="md"
          />
          
          {location && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Radius: {filters.distance} km
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={filters.distance}
                onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                className="w-24"
              />
            </div>
          )}
          
          <input
            type="text"
            placeholder="City (optional)"
            value={filters.city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Mobile Filters Modal */}
        {showFilters && (
          <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
            <div className="bg-white rounded-t-lg w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <UseLocationButton
                    onLocationUpdate={handleLocationUpdate}
                    variant="primary"
                    size="md"
                  />
                  
                  {location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search Radius: {filters.distance} km
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={filters.distance}
                        onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter city name"
                      value={filters.city}
                      onChange={(e) => handleCityChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Categories
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        'Furniture', 'Electronics', 'Clothing', 'Toys',
                        'Books', 'Tools', 'Kitchen', 'Sports',
                        'Garden', 'Art', 'Collectibles', 'Miscellaneous'
                      ].map((category) => (
                        <label key={category} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={filters.categories.includes(category)}
                            onChange={() => handleCategoryToggle(category)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Grid */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? 'Searching...' : `${sales.length} sales found`}
            </h2>
          </div>

          {sales.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
              <p className="text-gray-500">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {sales.map((sale) => (
                <div
                  key={sale.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedSale(sale)}
                >
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {sale.title}
                      </h3>
                      {sale.is_featured && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2 flex-shrink-0">
                          Featured
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {sale.city}, {sale.state}
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatDate(sale.date_start)} at {formatTime(sale.time_start)}
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        {getPriceDisplay(sale.price)}
                      </div>
                    </div>
                    
                    {sale.tags && sale.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {sale.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                        {sale.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{sale.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Map View</h3>
            <div className="h-96 rounded-lg overflow-hidden">
              <SalesMap
                sales={sales}
                center={currentCenter}
                onSaleClick={setSelectedSale}
                selectedSaleId={selectedSale?.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
