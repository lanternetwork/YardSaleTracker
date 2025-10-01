'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sale } from '@/lib/types'
import { GetSalesParams, formatDistance } from '@/lib/data/sales'
import SalesMap from '@/components/location/SalesMap'
import UseLocationButton from '@/components/location/UseLocationButton'
import { useLocation } from '@/lib/location/useLocation'
import SaleCard from '@/components/SaleCard'
import FiltersModal from '@/components/filters/FiltersModal'
import FilterTrigger from '@/components/filters/FilterTrigger'
import { useFilters } from '@/lib/hooks/useFilters'
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
  const { filters, updateFilters, hasActiveFilters } = useFilters()

  const [sales, setSales] = useState<Sale[]>(initialSales)
  const [loading, setLoading] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)

  const fetchSales = useCallback(async () => {
    setLoading(true)
    const params: GetSalesParams = {
      lat: filters.lat,
      lng: filters.lng,
      distanceKm: filters.distance,
      city: filters.city,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      dateRange: filters.dateRange !== 'any' ? filters.dateRange : undefined,
      limit: 50,
      offset: 0,
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
  }, [filters])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  useEffect(() => {
    if (location && location.lat && location.lng) {
      updateFilters({
        lat: location.lat,
        lng: location.lng
      })
    }
  }, [location, updateFilters])

  const handleLocationClick = () => {
    getLocation()
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="lg:w-2/3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-3xl font-bold mb-4 sm:mb-0">Sales Search</h1>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Location Button */}
              <UseLocationButton 
                onClick={handleLocationClick} 
                loading={locationLoading} 
                error={locationError?.message || null} 
              />
              
              {/* Mobile Filter Trigger */}
              <FilterTrigger
                isOpen={showFiltersModal}
                onToggle={() => setShowFiltersModal(!showFiltersModal)}
                activeFiltersCount={hasActiveFilters ? 1 : 0}
                className="sm:hidden"
              />
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

        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block lg:w-1/3">
          <div className="sticky top-4 space-y-6">
            {/* Filters */}
            <FiltersModal isOpen={true} onClose={() => {}} />
            
            {/* Map */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-xl font-semibold mb-4">Map View</h2>
              <div className="h-[400px] rounded-lg overflow-hidden">
                <SalesMap
                  sales={sales}
                  center={filters.lat && filters.lng ? { lat: filters.lat, lng: filters.lng } : { lat: 38.2527, lng: -85.7585 }}
                  zoom={filters.lat && filters.lng ? 12 : 10}
                />
              </div>
              
              {/* Location Info */}
              {filters.lat && filters.lng && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Searching within {filters.distance} miles</strong> of your location
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

      {/* Mobile Filters Modal */}
      <FiltersModal 
        isOpen={showFiltersModal} 
        onClose={() => setShowFiltersModal(false)} 
      />
    </div>
  )
}