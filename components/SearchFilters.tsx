'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { defaultFilters, Filters } from '@/state/filters'
import { trackCenterCorrection } from '@/lib/analytics/events'

const COMMON_TAGS = [
  'antiques', 'furniture', 'clothing', 'books', 'toys', 'electronics',
  'kitchen', 'tools', 'art', 'jewelry', 'sports', 'collectibles'
]

export default function SearchFilters({ 
  onChange
}: { 
  onChange: (f: Filters) => void
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [f, setF] = useState<Filters>(defaultFilters)
  const [showMore, setShowMore] = useState(true) // Always show filters
  const [zipCode, setZipCode] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  
  // Debug state changes
  useEffect(() => {
    console.log('🔄 isGeocoding state changed to:', isGeocoding)
  }, [isGeocoding])
  
  useEffect(() => {
    console.log('📝 zipCode state changed to:', zipCode)
  }, [zipCode])

  // Initialize filters from URL params
  useEffect(() => {
    const urlFilters: Filters = {
      q: searchParams.get('q') || '',
      maxKm: searchParams.get('maxKm') ? Number(searchParams.get('maxKm')) : 25,
      dateFrom: searchParams.get('dateFrom') || defaultFilters.dateFrom,
      dateTo: searchParams.get('dateTo') || defaultFilters.dateTo,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : []
    }
    setF(urlFilters)
    onChange(urlFilters)
    
    // Initialize ZIP from URL
    const zip = searchParams.get('zip')
    if (zip) {
      setZipCode(zip)
    }
  }, [searchParams, onChange])

  function set<K extends keyof Filters>(k: K, v: any) { 
    const n = { ...f, [k]: v }
    setF(n)
    onChange(n)
    
    // Update URL params
    const params = new URLSearchParams(searchParams.toString())
    if (v === '' || v === undefined || v === null || (Array.isArray(v) && v.length === 0)) {
      params.delete(k)
    } else if (Array.isArray(v)) {
      params.set(k, v.join(','))
    } else {
      params.set(k, String(v))
    }
    
    const newUrl = `${pathname}?${params.toString()}`
    router.replace(newUrl, { scroll: false })
  }

  const toggleTag = (tag: string) => {
    const currentTags = f.tags || []
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag]
    set('tags', newTags)
  }

  const clearFilters = () => {
    setF(defaultFilters)
    onChange(defaultFilters)
    setZipCode('')
    router.replace(pathname, { scroll: false })
  }

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by this browser', 'error')
      return
    }

    setIsGettingLocation(true)

    // Show a friendly message about location access
    showToast('Requesting location access...', 'info')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        // Update URL with new coordinates
        const params = new URLSearchParams(searchParams.toString())
        params.set('lat', latitude.toString())
        params.set('lng', longitude.toString())
        params.delete('zip') // Clear ZIP since we're using precise coordinates
        
        // Update cookie
        const centerData = {
          lat: latitude,
          lng: longitude,
          radius: f.maxKm || 25,
          ts: Date.now()
        }
        document.cookie = `la_center=${JSON.stringify(centerData)}; path=/; max-age=${90 * 24 * 60 * 60}`
        
        // Navigate to new URL
        const newUrl = `${pathname}?${params.toString()}`
        router.push(newUrl)
        
        setIsGettingLocation(false)
        showToast('Location updated successfully!', 'success')
        
        // Track analytics
        trackCenterCorrection({
          from: 'unknown',
          to: 'device'
        })
      },
      (error) => {
        console.error('Geolocation error:', error)
        let message = 'Unable to get your location'
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Location access denied. Please allow location access in your browser settings.'
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'Location unavailable. Please try again.'
        } else if (error.code === error.TIMEOUT) {
          message = 'Location request timed out. Please try again.'
        }
        
        showToast(message, 'error')
        setIsGettingLocation(false)
      },
      {
        enableHighAccuracy: false,
        timeout: 10000, // Increased timeout
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const toast = document.createElement('div')
    const bgColor = type === 'error' ? 'bg-red-100 text-red-800' : 
                   type === 'success' ? 'bg-green-100 text-green-800' : 
                   'bg-blue-100 text-blue-800'
    
    toast.className = `fixed top-4 right-4 ${bgColor} px-4 py-2 rounded shadow-lg z-50 text-sm`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 4000)
  }

  const geocodeZip = async (zip: string, bypassCache = false) => {
    console.log('🚀 GEOCODING FUNCTION CALLED')
    console.log('ZIP Code:', zip)
    console.log('Bypass Cache:', bypassCache)
    console.log('Is Geocoding:', isGeocoding)
    
    if (!/^\d{5}$/.test(zip)) {
      console.log('❌ Invalid ZIP code format')
      alert('Please enter a valid 5-digit ZIP code')
      return
    }

    if (isGeocoding) {
      console.log('⏳ Already geocoding, skipping request')
      return
    }

    console.log('=== GEOCODING DEBUG ===')
    console.log('ZIP Code:', zip)
    console.log('Bypass Cache:', bypassCache)
    console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR')
    console.log('Current Search Params:', searchParams.toString())
    console.log('Is Geocoding:', isGeocoding)
    console.log('========================')

    console.log('🔄 Setting isGeocoding to true')
    setIsGeocoding(true)
    
    // Show immediate feedback
    console.log('Geocoding ZIP:', zip, bypassCache ? '(bypassing cache)' : '')
    
    try {
      const startTime = Date.now()
      const timestamp = Date.now()
      const url = `/api/geocode/zip?zip=${zip}${bypassCache ? '&bypass=true' : ''}&t=${timestamp}`
      console.log('Fetching from URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const geocodeTime = Date.now() - startTime
      console.log(`Geocoding took ${geocodeTime}ms`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Geocoding failed')
      }
      
      const data = await response.json()
      console.log('Geocoding result:', data)
      
      // Update URL with new coordinates
      const params = new URLSearchParams(searchParams.toString())
      params.set('zip', zip)
      
      // Add tiny offset to force map re-centering even with same coordinates
      const latOffset = Math.random() * 0.0001 - 0.00005 // ±0.00005 degrees (~5 meters)
      const lngOffset = Math.random() * 0.0001 - 0.00005
      
      params.set('lat', (data.lat + latOffset).toString())
      params.set('lng', (data.lng + lngOffset).toString())
      
      // Add timestamp to force URL change even with same coordinates
      params.set('t', Date.now().toString())
      
      const newUrl = `${pathname}?${params.toString()}`
      console.log('Updating URL to:', newUrl)
      
      // Show success feedback
      console.log(`✅ ZIP code ${zip} geocoded successfully to ${data.city}, ${data.state}`)
      
      // Track analytics
      trackCenterCorrection({
        from: 'unknown',
        to: 'zip'
      })
      
      // Simple success feedback without DOM manipulation
      console.log(`🎉 ZIP code search completed successfully!`)
      
      // Use router.push instead of replace for better UX
      router.push(newUrl, { scroll: false })
      
    } catch (error) {
      console.error('ZIP geocoding error:', error)
      alert(`Could not find location for ZIP code ${zip}. Please try a different ZIP code.`)
    } finally {
      setIsGeocoding(false)
    }
  }


  return (
    <div className="space-y-4">
      {/* Main search bar */}
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <input 
            className="w-full px-4 py-2 pl-10 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent" 
            placeholder="Search sales by title or description..." 
            value={f.q || ''}
            onChange={e => set('q', e.target.value)} 
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
            🔍
          </div>
        </div>
        <button 
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
          onClick={() => {
            // Trigger search by updating URL with current filters
            const params = new URLSearchParams(searchParams.toString())
            if (f.q) params.set('q', f.q)
            if (f.maxKm && f.maxKm !== 25) params.set('maxKm', f.maxKm.toString())
            if (f.dateFrom) params.set('dateFrom', f.dateFrom)
            if (f.dateTo) params.set('dateTo', f.dateTo)
            if (f.tags && f.tags.length > 0) params.set('tags', f.tags.join(','))
            
            const newUrl = `${pathname}?${params.toString()}`
            router.push(newUrl)
          }}
        >
          🔍 Search
        </button>
      </div>

      {/* Search filters - always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-neutral-50 rounded-lg">
          {/* ZIP Code input */}
          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <div className="flex gap-1">
              <input 
                type="text"
                className="flex-1 px-2 py-1 rounded border text-sm" 
                placeholder="12345"
                value={zipCode}
                onChange={e => setZipCode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    console.log('⌨️ Enter key pressed for ZIP:', zipCode)
                    geocodeZip(zipCode, true) // Always bypass cache on Enter
                  }
                }}
                onBlur={() => {
                  if (zipCode && /^\d{5}$/.test(zipCode)) {
                    geocodeZip(zipCode)
                  }
                }}
                maxLength={5}
                pattern="\d{5}"
              />
              <button
                className="px-2 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1"
                onClick={() => {
                  console.log('🔍 ZIP code search button clicked for ZIP:', zipCode)
                  console.log('Button disabled?', isGeocoding || !zipCode)
                  geocodeZip(zipCode, true) // Always bypass cache on button click
                }}
                disabled={isGeocoding || !zipCode}
              >
                {isGeocoding ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                    <span>...</span>
                  </>
                ) : (
                  'Go'
                )}
              </button>
            </div>
            {/* Device location button */}
            <button
              className="mt-2 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1 disabled:opacity-50"
              onClick={useDeviceLocation}
              disabled={isGeocoding || isGettingLocation}
            >
              {isGettingLocation ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600"></div>
                  Getting location...
                </>
              ) : (
                <>
                  📍 Use device location (optional)
                </>
              )}
            </button>
          </div>

          {/* Distance filter */}
          <div>
            <label className="block text-sm font-medium mb-1">Max Distance</label>
            <select 
              className="w-full px-2 py-1 rounded border text-sm" 
              value={f.maxKm || 25}
              onChange={e => set('maxKm', Number(e.target.value))}
            >
              <option value={5}>5 km (3 miles)</option>
              <option value={10}>10 km (6 miles)</option>
              <option value={25}>25 km (15 miles)</option>
              <option value={50}>50 km (30 miles)</option>
              <option value={100}>100 km (60 miles)</option>
              <option value={250}>250 km (150 miles)</option>
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <input 
              type="date" 
              className="w-full px-2 py-1 rounded border text-sm" 
              value={f.dateFrom || ''}
              onChange={e => set('dateFrom', e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <input 
              type="date" 
              className="w-full px-2 py-1 rounded border text-sm" 
              value={f.dateTo || ''}
              onChange={e => set('dateTo', e.target.value)} 
            />
          </div>

        </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {COMMON_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                f.tags?.includes(tag)
                  ? 'bg-amber-500 text-white'
                  : 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        {f.tags && f.tags.length > 0 && (
          <div className="mt-2 text-sm text-neutral-600">
            Selected: {f.tags.join(', ')}
          </div>
        )}
      </div>

    </div>
  )
}
