'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sale, GetSalesParams, formatDistance } from '@/lib/data/sales'
import SalesMap from '@/components/location/SalesMap'
import UseLocationButton from '@/components/location/UseLocationButton'
import { useLocation } from '@/lib/location/useLocation'
import SaleCard from '@/components/SaleCard'
import { User } from '@supabase/supabase-js'

interface SalesClientProps {
  initialSales: Sale[]
  initialSearchParams: {
    lat?: string
    lng?: string
    distanceKm?: string
    city?: string
    categories?: string
    dateFrom?: string
    dateTo?: string
    page?: string
    pageSize?: string
  }
  user: User | null
}

export default function SalesClient({ initialSales, initialSearchParams, user }: SalesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { location, getLocation, loading: locationLoading, error: locationError } = useLocation()

  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [loading, setLoading] = useState(false)
  const [currentLat, setCurrentLat] = useState<number | undefined>(initialSearchParams.lat ? parseFloat(initialSearchParams.lat) : undefined)
  const [currentLng, setCurrentLng] = useState<number | undefined>(initialSearchParams.lng ? parseFloat(initialSearchParams.lng) : undefined)
  const [currentDistance, setCurrentDistance] = useState<number>(initialSearchParams.distanceKm ? parseFloat(initialSearchParams.distanceKm) : 25)
  const [currentCity, setCurrentCity] = useState<string>(initialSearchParams.city || '')
  const [currentCategories, setCurrentCategories] = useState<string[]>(initialSearchParams.categories ? initialSearchParams.categories.split(',') : [])
  const [currentDateRange, setCurrentDateRange] = useState<'today' | 'weekend' | 'any'>('any')
  const [currentPage, setCurrentPage] = useState<number>(initialSearchParams.page ? parseInt(initialSearchParams.page) : 1)
  const [pageSize, setPageSize] = useState<number>(initialSearchParams.pageSize ? parseInt(initialSearchParams.pageSize) : 50)
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  const fetchSales = useCallback(async () => {
    setLoading(true)
    const params: GetSalesParams = {
      lat: currentLat,
      lng: currentLng,
      distanceKm: currentDistance,
      city: currentCity || undefined,
      categories: currentCategories.length > 0 ? currentCategories : undefined,
      dateRange: currentDateRange !== 'any' ? currentDateRange : undefined,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }

    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            acc[key] = value.join(',')
          } else {
            acc[key] = String(value)
          }
        }
        return acc
      }, {} as Record<string, string>)
    ).toString()

    try {
      const res = await fetch(`/api/sales/search?${queryString}`)
      const data = await res.json()
      setSales(data.sales || [])
    } catch (error) {
      console.error('Error fetching sales:', error)
    } finally {
      setLoading(false)
    }
  }, [currentLat, currentLng, currentDistance, currentCity, currentCategories, currentDateRange, currentPage, pageSize])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  useEffect(() => {
    if (location && location.latitude && location.longitude) {
      setCurrentLat(location.latitude)
      setCurrentLng(location.longitude)
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.set('lat', location.latitude.toString())
      newSearchParams.set('lng', location.longitude.toString())
      router.push(`/sales?${newSearchParams.toString()}`)
    }
  }, [location, router, searchParams])

  const handleLocationClick = () => {
    getLocation()
  }

  const handleFilterChange = (newFilters: Partial<GetSalesParams>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    if (newFilters.lat !== undefined) newSearchParams.set('lat', newFilters.lat.toString())
    if (newFilters.lng !== undefined) newSearchParams.set('lng', newFilters.lng.toString())
    if (newFilters.distanceKm !== undefined) newSearchParams.set('distanceKm', newFilters.distanceKm.toString())
    if (newFilters.city !== undefined) newSearchParams.set('city', newFilters.city)
    if (newFilters.categories !== undefined) newSearchParams.set('categories', newFilters.categories.join(','))
    if (newFilters.dateRange !== undefined) newSearchParams.set('dateRange', newFilters.dateRange)

    router.push(`/sales?${newSearchParams.toString()}`)
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="lg:w-2/3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-3xl font-bold mb-4 sm:mb-0">Sales Search</h1>
            
            {/* Location Button */}
            <div className="w-full sm:w-auto">
              <UseLocationButton 
                onClick={handleLocationClick} 
                loading={locationLoading} 
                error={locationError} 
              />
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 p-4 border rounded-lg shadow-sm bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h2 className="text-xl font-semibold mb-2 sm:mb-0">Filters</h2>
              <button
                onClick={() => setShowFiltersModal(!showFiltersModal)}
                className="sm:hidden px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px]"
              >
                {showFiltersModal ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${showFiltersModal ? 'block' : 'hidden sm:grid'}`}>
              {/* Distance Filter */}
              <div>
                <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
                  Distance: {currentDistance} km
                </label>
                <input
                  type="range"
                  id="distance"
                  min="1"
                  max="100"
                  value={currentDistance}
                  onChange={(e) => setCurrentDistance(parseFloat(e.target.value))}
                  onMouseUp={() => handleFilterChange({ distanceKm: currentDistance })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 km</span>
                  <span>100 km</span>
                </div>
              </div>

              {/* City Filter */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  id="city"
                  value={currentCity}
                  onChange={(e) => setCurrentCity(e.target.value)}
                  onBlur={() => handleFilterChange({ city: currentCity })}
                  placeholder="Enter city name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Date Range Filter */}
              <div>
                <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  id="dateRange"
                  value={currentDateRange}
                  onChange={(e) => {
                    const value = e.target.value as 'today' | 'weekend' | 'any'
                    setCurrentDateRange(value)
                    handleFilterChange({ dateRange: value })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="any">Any Date</option>
                  <option value="today">Today</option>
                  <option value="weekend">This Weekend</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => fetchSales()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-h-[44px]"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Sales Grid */}
          <div className="mb-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading sales...</span>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No sales found matching your criteria.</p>
                <p className="text-gray-400 mt-2">Try adjusting your filters or location.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sales.map((sale) => (
                  <SaleCard key={sale.id} sale={sale} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Sidebar */}
        <div className="lg:w-1/3">
          <div className="sticky top-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-xl font-semibold mb-4">Map View</h2>
              <div className="h-[400px] rounded-lg overflow-hidden">
                <SalesMap
                  sales={sales}
                  center={currentLat && currentLng ? { lat: currentLat, lng: currentLng } : { lat: 38.2527, lng: -85.7585 }}
                  zoom={currentLat && currentLng ? 12 : 10}
                />
              </div>
              
              {/* Location Info */}
              {currentLat && currentLng && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Searching within {currentDistance} km</strong> of your location
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Found {sales.length} sales
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}