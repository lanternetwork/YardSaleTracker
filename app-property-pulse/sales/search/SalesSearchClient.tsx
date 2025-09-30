'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sale } from '@/lib/data'
import SalesMap from '@/components/location/SalesMap'
import UseLocationButton from '@/components/location/UseLocationButton'
import SaleCard from '@/components/SaleCard'
import { useLocationSearch } from '@/lib/location/useLocation'

interface SalesSearchClientProps {
  initialSales: Sale[]
  initialLocation?: { lat: number; lng: number }
  initialDistance?: number
  initialCity?: string
  initialCategories?: string[]
}

export default function SalesSearchClient({
  initialSales,
  initialLocation,
  initialDistance = 25,
  initialCity,
  initialCategories
}: SalesSearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { location, searchWithLocation, setSearchRadius } = useLocationSearch()
  
  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [loading, setLoading] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [searchFilters, setSearchFilters] = useState({
    city: initialCity || '',
    distance: initialDistance,
    categories: initialCategories || []
  })

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
        
        if (searchFilters.city) params.set('city', searchFilters.city)
        if (searchFilters.categories.length > 0) params.set('categories', searchFilters.categories.join(','))

        const response = await fetch(`/api/sales/search?${params.toString()}`)
        if (!response.ok) throw new Error('Search failed')
        
        return response.json()
      })

      setSales(results)
      updateURL({ lat: location.lat, lng: location.lng, distance: searchFilters.distance })
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (params: { lat?: number; lng?: number; distance?: number; city?: string; categories?: string[] }) => {
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

    router.push(`/sales/search?${newParams.toString()}`)
  }

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setSearchRadius(25) // Reset to default distance
    updateURL({ lat: location.lat, lng: location.lng, distance: 25 })
  }

  const handleDistanceChange = (distance: number) => {
    setSearchFilters(prev => ({ ...prev, distance }))
    if (location) {
      updateURL({ lat: location.lat, lng: location.lng, distance })
    }
  }

  const handleCityChange = (city: string) => {
    setSearchFilters(prev => ({ ...prev, city }))
    updateURL({ city: city || undefined })
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = searchFilters.categories.includes(category)
      ? searchFilters.categories.filter(c => c !== category)
      : [...searchFilters.categories, category]
    
    setSearchFilters(prev => ({ ...prev, categories: newCategories }))
    updateURL({ categories: newCategories.length > 0 ? newCategories : undefined })
  }

  const currentCenter = location || initialLocation || { lat: 38.2527, lng: -85.7585 }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Search Filters */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Search Filters</h2>
          
          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Location</h3>
            
            <UseLocationButton
              onLocationUpdate={handleLocationUpdate}
              variant="primary"
              size="md"
            />
            
            {location && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Search Radius: {searchFilters.distance} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={searchFilters.distance}
                  onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 km</span>
                  <span>100 km</span>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City (optional)
              </label>
              <input
                type="text"
                value={searchFilters.city}
                onChange={(e) => handleCityChange(e.target.value)}
                placeholder="Enter city name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Categories Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Categories</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Furniture', 'Electronics', 'Clothing', 'Toys',
                'Books', 'Tools', 'Kitchen', 'Sports',
                'Garden', 'Art', 'Collectibles', 'Miscellaneous'
              ].map((category) => (
                <label key={category} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={searchFilters.categories.includes(category)}
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

      {/* Results */}
      <div className="lg:col-span-2 space-y-6">
        {/* Map */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Map View</h2>
          <SalesMap
            sales={sales}
            center={currentCenter}
            onSaleClick={setSelectedSale}
            selectedSaleId={selectedSale?.id}
          />
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Sales ({sales.length})
            </h2>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Searching...
              </div>
            )}
          </div>

          {sales.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No sales found in your area</p>
              <p className="text-sm text-gray-400 mt-2">
                Try expanding your search radius or removing filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sales.map((sale) => (
                <SaleCard key={sale.id} sale={sale} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
