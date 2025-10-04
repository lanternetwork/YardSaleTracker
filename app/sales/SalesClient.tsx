'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Sale } from '@/lib/types'
import { GetSalesParams, formatDistance } from '@/lib/data/sales'
import SalesMap from '@/components/location/SalesMap'
import ZipInput from '@/components/location/ZipInput'
import { useLocation } from '@/lib/location/useLocation'
import SaleCard from '@/components/SaleCard'
import FiltersModal from '@/components/filters/FiltersModal'
import FilterTrigger from '@/components/filters/FilterTrigger'
import DateWindowLabel from '@/components/filters/DateWindowLabel'
import DegradedBanner from '@/components/DegradedBanner'
import { useFilters } from '@/lib/hooks/useFilters'
import { useApp } from '@/lib/contexts/AppContext'
import { User } from '@supabase/supabase-js'

// Cookie utility functions
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

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
  const { location: appLocation, preloadedSales, isPreloading } = useApp()
  
  // Debug AppContext state
  useEffect(() => {
    console.log(`[SALES] AppContext state: appLocation=${!!appLocation}, preloadedSales=${preloadedSales.length}, isPreloading=${isPreloading}`)
  }, [appLocation, preloadedSales.length, isPreloading])

  // Check for cached sales immediately on mount
  const [sales, setSales] = useState<Sale[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('preloaded_sales')
        if (stored) {
          const { sales: cachedSales, timestamp } = JSON.parse(stored)
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log(`[SALES] Loading cached sales immediately on mount: ${cachedSales.length} items`)
            return cachedSales
          }
        }
      } catch (error) {
        console.error('Failed to load cached sales on mount:', error)
      }
    }
    return initialSales
  })
  const [loading, setLoading] = useState(false)
  const [showLoading, setShowLoading] = useState(false) // Delayed loading state
  const [debouncedDistance, setDebouncedDistance] = useState(filters.distance || 25)
  
  // Add delay to loading message to prevent flash
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    
    if (loading || (sales.length === 0 && preloadedSales.length === 0)) {
      // Show loading after 300ms delay
      timeoutId = setTimeout(() => {
        setShowLoading(true)
      }, 300)
    } else {
      // Hide loading immediately when data is available
      setShowLoading(false)
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [loading, sales.length, preloadedSales.length])

  // Debounce distance changes to reduce slider lag
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedDistance(filters.distance || 25)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [filters.distance])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [zipError, setZipError] = useState<string | null>(null)
  const [dateWindow, setDateWindow] = useState<any>(null)
  const [degraded, setDegraded] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null) // Track selected sale for highlighting
  const [locationInitialized, setLocationInitialized] = useState(!!(initialSearchParams.lat && initialSearchParams.lng)) // Track if location has been initialized
  const [initialLocationLoading, setInitialLocationLoading] = useState(false) // Start with false
  const [isSettingLocation, setIsSettingLocation] = useState(false) // Track if we're currently setting location
  const [usingPreloadedSales, setUsingPreloadedSales] = useState(false) // Track if we're using preloaded sales
  const widenedOnceRef = useRef(false)

  // Use preloaded sales if available
  useEffect(() => {
    console.log(`[SALES] Preloaded check: preloaded=${preloadedSales.length}, initial=${initialSales.length}, current=${sales.length}, appLocation=${!!appLocation}`)
    
    if (preloadedSales.length > 0 && initialSales.length === 0 && sales.length === 0) {
      console.log(`[SALES] Using preloaded sales: ${preloadedSales.length} items`)
      setSales(preloadedSales)
      setUsingPreloadedSales(true)
      setLocationInitialized(true)
      setInitialLocationLoading(false)
      if (appLocation) {
        updateFilters({
          lat: appLocation.lat,
          lng: appLocation.lng,
          city: appLocation.city
        })
      }
    }
  }, [preloadedSales, initialSales.length, sales.length, appLocation, updateFilters])

  // If we have cached sales, immediately set loading to false and prevent API calls
  useEffect(() => {
    if (sales.length > 0) {
      setInitialLocationLoading(false)
      setLocationInitialized(true)
      // If we have sales and they came from cache, prevent API calls
      if (sales.length > 0 && initialSales.length === 0) {
        setUsingPreloadedSales(true)
      }
    }
  }, [sales.length, initialSales.length])

  // Check if we already have location from initial state
  useEffect(() => {
    if (filters.lat && filters.lng) {
      console.log(`[SALES] Location detected in filters: ${filters.lat}, ${filters.lng}`)
      setLocationInitialized(true)
      setInitialLocationLoading(false)
      // Clear the setting location flag after a short delay
      if (isSettingLocation) {
        setTimeout(() => setIsSettingLocation(false), 100)
      }
    } else if (locationInitialized && !filters.lat && !filters.lng) {
      console.log(`[SALES] Location lost from filters - this shouldn't happen`)
    }
  }, [filters.lat, filters.lng, locationInitialized, isSettingLocation])


  const fetchSales = useCallback(async () => {
    setLoading(true)
    console.log(`[SALES] fetchSales called with location: ${filters.lat}, ${filters.lng}`)
    
    // If no location, don't try to fetch sales yet
    if (!filters.lat || !filters.lng) {
      console.log('[SALES] No location provided, waiting for location')
      setSales([])
      setDateWindow(null)
      setDegraded(false)
      setLoading(false)
      return
    }

    const params: GetSalesParams = {
      lat: filters.lat,
      lng: filters.lng,
      distanceKm: debouncedDistance * 1.60934, // Convert miles to km
      city: filters.city,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
      dateRange: filters.dateRange !== 'any' ? filters.dateRange : undefined,
      limit: 24,
      ...(cursor ? { cursor } : { offset: 0 })
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
      console.log(`[SALES] Fetching from: /api/sales?${queryString}`)
      const res = await fetch(`/api/sales?${queryString}`)
      const data = await res.json()
      console.log(`[SALES] API response:`, data)
      
      if (data.ok) {
        setSales(prev => cursor ? [...prev, ...(data.data || [])] : (data.data || []))
        setDateWindow(data.dateWindow || null)
        setDegraded(data.degraded || false)
        setHasMore(Boolean(data.nextCursor))
        setCursor(data.nextCursor || null)
        console.log(`[SALES] Set ${data.data?.length || 0} sales`)

        // If first page and zero results, auto-widen radius once to improve first-load experience
        if (!cursor && (!data.data || data.data.length === 0) && !widenedOnceRef.current) {
          widenedOnceRef.current = true
          const widened = Math.min((filters.distance || 25) * 2, 100)
          console.log(`[SALES] No results; widening distance to ${widened} miles and refetching`)
          updateFilters({ distance: widened })
        }
      } else {
        console.error('Sales API error:', data.error)
        setSales([])
        setDateWindow(null)
        setDegraded(false)
        setCursor(null)
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
      setSales([])
    } finally {
      setLoading(false)
    }
  }, [filters.lat, filters.lng, debouncedDistance, filters.city, filters.categories, filters.dateRange, cursor])

  useEffect(() => {
    console.log(`[SALES] Filters changed: lat=${filters.lat}, lng=${filters.lng}, city=${filters.city}, dateRange=${filters.dateRange}`)
    // Reset pagination on filter change
    setCursor(null)
    setHasMore(false)
    
    // Clear preloaded sales flag when filters change to allow API calls
    if (usingPreloadedSales) {
      console.log(`[SALES] Clearing preloaded sales flag due to filter change`)
      setUsingPreloadedSales(false)
    }
    
    fetchSales()
  }, [filters.lat, filters.lng, debouncedDistance, filters.city, filters.categories, filters.dateRange, usingPreloadedSales, preloadedSales.length])


  // Removed location detection to prevent pin UI
  useEffect(() => {
    const cookieData = getCookie('la_loc')
    if (cookieData && !filters.lat && !filters.lng) {
      try {
        const locationData = JSON.parse(cookieData)
        if (locationData.lat && locationData.lng) {
          console.log(`[SALES] Loading location from cookie: ${locationData.zip} (${locationData.city}, ${locationData.state})`)
          updateFilters({
            lat: locationData.lat,
            lng: locationData.lng,
            city: locationData.city
          })
          setLocationInitialized(true)
          setInitialLocationLoading(false)
        }
      } catch (error) {
        console.error('Failed to parse location cookie:', error)
      }
    } else {
      // No cookie, will try IP lookup
      setInitialLocationLoading(false)
    }
  }, []) // Only run on mount


  // Fallback: Infer approximate location from IP if no cookie or browser location
  const ipLookupStarted = useRef(false)
  useEffect(() => {
    async function inferFromIp() {
      try {
        const res = await fetch('/api/geolocation/ip')
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        if (!data || !data.ok) return
        const { lat, lng, city, state } = data
        if (typeof lat === 'number' && typeof lng === 'number' && !filters.lat && !filters.lng) {
          console.log(`[SALES] IP lookup found location: ${lat}, ${lng} (${city})`)
          setIsSettingLocation(true)
          updateFilters({ lat, lng, city })
          setLocationInitialized(true)
          setInitialLocationLoading(false)
          // Don't call fetchSales here - let the useEffect handle it
        }
      } catch {}
    }
    if (!filters.lat && !filters.lng && !ipLookupStarted.current) {
      ipLookupStarted.current = true
      inferFromIp()
      // Final fallback: if IP lookup fails, set a neutral default after short delay
      const fallbackTimer = setTimeout(() => {
        if (!filters.lat && !filters.lng) {
          updateFilters({ lat: 38.2527, lng: -85.7585, city: undefined })
          setLocationInitialized(true)
          setInitialLocationLoading(false)
        }
      }, 1500)
      return () => clearTimeout(fallbackTimer)
    }
  }, [filters.lat, filters.lng, updateFilters])

  const handleZipLocationFound = (lat: number, lng: number, city?: string, state?: string, zip?: string) => {
    setZipError(null)
    console.log(`[ZIP] Setting new location: ${lat}, ${lng} (${city}, ${state})`)
    
    updateFilters({
      lat,
      lng,
      city: city || undefined
    })
    setLocationInitialized(true)
    
    // Update URL with new location and ZIP
    const params = new URLSearchParams(searchParams.toString())
    params.set('lat', lat.toString())
    params.set('lng', lng.toString())
    if (city) params.set('city', city)
    if (state) params.set('state', state)
    if (zip) params.set('zip', zip)
    
    const newUrl = `${window.location.pathname}?${params.toString()}`
    router.push(newUrl)
    
    // Force a manual fetch to ensure it happens
    console.log(`[ZIP] Manually triggering fetchSales after ZIP lookup`)
    setTimeout(() => {
      fetchSales()
    }, 100)
  }

  const handleZipError = (error: string) => {
    setZipError(error)
  }

  const handleSaleClick = (sale: Sale) => {
    setSelectedSaleId(sale.id)
    
    // Scroll to the corresponding card
    const cardElement = document.getElementById(`sale-card-${sale.id}`)
    if (cardElement) {
      cardElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
      
      // Add a temporary highlight effect
      cardElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50')
      setTimeout(() => {
        cardElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50')
      }, 2000)
    }
  }

  return (
    <div className="container mx-auto px-4 py-2 sm:px-6 sm:py-4">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Main Content */}
        <div className="lg:w-2/3 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <div className="w-full sm:w-auto">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Sales Search</h1>
              {dateWindow && (
                <DateWindowLabel dateWindow={dateWindow} className="mb-2 sm:mb-4" />
              )}
              {degraded && (
                <DegradedBanner className="mb-2 sm:mb-4" />
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                  {/* ZIP Input */}
                  <div className="flex-1 sm:flex-none">
                    <div className="text-xs text-gray-500 mb-1">Search different area:</div>
                    <ZipInput
                      onLocationFound={handleZipLocationFound}
                      onError={handleZipError}
                      placeholder="Enter ZIP code"
                      className="w-full sm:w-auto min-h-[44px]"
                    />
                    {zipError && (
                      <p className="text-red-500 text-sm mt-1">{zipError}</p>
                    )}
                  </div>
              
              
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
            {showLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading yard sales...</span>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-testid="sales-grid">
                  {sales.map((sale) => (
                    <div 
                      key={sale.id} 
                      id={`sale-card-${sale.id}`}
                      className={`transition-all duration-200 ${
                        selectedSaleId === sale.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                      }`}
                    >
                      <SaleCard sale={sale} />
                    </div>
                  ))}
                </div>
                {hasMore && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      className="min-h-[44px] min-w-[44px] rounded border px-6 py-3 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      disabled={loading}
                      onClick={() => fetchSales()}
                      aria-label={loading ? 'Loading more sales...' : 'Load more sales'}
                    >
                      {loading ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Map Section */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold mb-4">Map View</h2>
            <div className="h-[250px] rounded-lg overflow-hidden">
              <SalesMap
                sales={sales}
                center={filters.lat && filters.lng ? { lat: filters.lat, lng: filters.lng } : { lat: 38.2527, lng: -85.7585 }}
                zoom={filters.lat && filters.lng ? 12 : 10}
                onSaleClick={handleSaleClick}
                selectedSaleId={selectedSaleId || undefined}
              />
            </div>
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

        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block lg:w-1/3">
          <div className="sticky top-4 space-y-6">
            {/* Filters */}
            <FiltersModal isOpen={true} onClose={() => {}} />
            
            {/* Map */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Map View</h2>
              <div className="h-[300px] sm:h-[400px] rounded-lg overflow-hidden">
                <SalesMap
                  sales={sales}
                  center={filters.lat && filters.lng ? { lat: filters.lat, lng: filters.lng } : { lat: 38.2527, lng: -85.7585 }}
                  zoom={filters.lat && filters.lng ? 12 : 10}
                  onSaleClick={handleSaleClick}
                  selectedSaleId={selectedSaleId || undefined}
                />
                {/* Debug info */}
                {filters.lat && filters.lng && (
                  <div className="mt-2 text-xs text-gray-500">
                    Center: {filters.lat.toFixed(4)}, {filters.lng.toFixed(4)} | Sales: {sales.length}
                  </div>
                )}
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