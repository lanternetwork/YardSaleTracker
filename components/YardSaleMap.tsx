'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { logger } from '@/lib/log'
import { maskLocation, MaskedLocation } from '@/lib/privacy'

type Marker = { 
  id: string
  title: string
  lat: number
  lng: number
  address: string
  privacy_mode: 'exact' | 'block_until_24h'
  date_start: string
  time_start?: string
}

export default function YardSaleMap({ points }: { points: Marker[] }) {
  console.log('YardSaleMap: Component initialized')
  
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  
  console.log('YardSaleMap received points:', points)
  
  const loader = useMemo(() => 
    new Loader({ 
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!, 
      libraries: ['places', 'geometry'],
      version: 'weekly'
    }), 
    []
  )

  // Initialize map
  useEffect(() => {
    console.log('YardSaleMap: Initializing map...')
    console.log('YardSaleMap: API key present:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
    
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('YardSaleMap: No Google Maps API key configured')
      setError('Google Maps API key not configured')
      setLoading(false)
      return
    }

    console.log('YardSaleMap: Loading Google Maps API...')
    loader.load().then(() => {
      console.log('YardSaleMap: Google Maps API loaded successfully')
      
      // Wait for DOM to be ready and retry if ref is not available
      let retryCount = 0
      const maxRetries = 50 // 5 seconds max
      
      const initializeMap = () => {
        if (!ref.current) {
          retryCount++
          if (retryCount > maxRetries) {
            console.error('YardSaleMap: Map container ref not available after', maxRetries, 'retries')
            setError('Map container not available')
            setLoading(false)
            return
          }
          console.log('YardSaleMap: Map container ref not ready, retrying in 100ms... (attempt', retryCount, '/', maxRetries, ')')
          setTimeout(initializeMap, 100)
          return
        }

        console.log('YardSaleMap: Map container ref is ready, creating map...')
        console.log('YardSaleMap: Container element:', ref.current)
        console.log('YardSaleMap: Container dimensions:', {
          width: ref.current.offsetWidth,
          height: ref.current.offsetHeight,
          clientWidth: ref.current.clientWidth,
          clientHeight: ref.current.clientHeight
        })
        
        // Default center (US center) with reasonable zoom
        const defaultCenter = { lat: 39.8283, lng: -98.5795 }
        const defaultZoom = 4

        console.log('YardSaleMap: Creating map instance...')
        const mapInstance = new google.maps.Map(ref.current, { 
          center: defaultCenter,
          zoom: defaultZoom,
          mapTypeControl: true, 
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        console.log('YardSaleMap: Map instance created successfully')
        setMap(mapInstance)
        setLoading(false)
      }
      
      // Start the initialization process
      initializeMap()
    }).catch(err => {
      console.error('YardSaleMap: Error loading Google Maps:', err)
      setError('Failed to load map')
      setLoading(false)
    })
  }, [loader])

  // Update markers when points change
  useEffect(() => {
    console.log('YardSaleMap: Updating markers...', { map: !!map, pointsCount: points.length })
    
    if (!map) {
      console.log('YardSaleMap: Map not ready yet, skipping marker update')
      return
    }

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: google.maps.Marker[] = []

    if (points.length === 0) {
      console.log('YardSaleMap: No points to display')
      setMarkers([])
      return
    }
    
    console.log('YardSaleMap: Processing', points.length, 'points')

    const bounds = new google.maps.LatLngBounds()
    
    // Apply privacy masking
    const maskedPoints = points.map(point => {
      const masked = maskLocation({
        lat: point.lat,
        lng: point.lng,
        address: point.address,
        privacy_mode: point.privacy_mode,
        date_start: point.date_start,
        time_start: point.time_start
      })
      
      return {
        ...point,
        lat: masked.lat,
        lng: masked.lng,
        address: masked.address,
        is_masked: masked.is_masked,
        reveal_time: masked.reveal_time
      }
    })
    
    // Simple clustering logic
    const clusters: { center: { lat: number; lng: number }; points: typeof maskedPoints }[] = []
    const clusterRadius = 0.01 // ~1km in degrees
    
    maskedPoints.forEach(point => {
      let addedToCluster = false
      
      for (const cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(point.lat - cluster.center.lat, 2) + 
          Math.pow(point.lng - cluster.center.lng, 2)
        )
        
        if (distance < clusterRadius) {
          cluster.points.push(point)
          // Update cluster center
          cluster.center.lat = cluster.points.reduce((sum, p) => sum + p.lat, 0) / cluster.points.length
          cluster.center.lng = cluster.points.reduce((sum, p) => sum + p.lng, 0) / cluster.points.length
          addedToCluster = true
          break
        }
      }
      
      if (!addedToCluster) {
        clusters.push({
          center: { lat: point.lat, lng: point.lng },
          points: [point]
        })
      }
    })
    
    // Create markers for clusters
    clusters.forEach(cluster => {
      if (cluster.points.length === 1) {
        // Single marker
        const point = cluster.points[0]
        const marker = new google.maps.Marker({ 
          position: { lat: point.lat, lng: point.lng }, 
          title: point.title, 
          map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        })
        
        const infoWindow = new google.maps.InfoWindow({ 
          content: `
            <div class="p-2">
              <h3 class="font-semibold text-lg">${point.title}</h3>
              <p class="text-sm text-neutral-600">${point.address}</p>
              ${point.is_masked ? '<p class="text-xs text-blue-600">🔒 Privacy mode active</p>' : ''}
              <a 
                href="/sale/${point.id}" 
                class="text-amber-600 hover:text-amber-700 font-medium"
              >
                View Details →
              </a>
            </div>
          `
        })
        
        marker.addListener('click', () => {
          infoWindow.open({ map, anchor: marker })
        })
        
        newMarkers.push(marker)
        bounds.extend(marker.getPosition()!)
      } else {
        // Cluster marker
        const marker = new google.maps.Marker({ 
          position: { lat: cluster.center.lat, lng: cluster.center.lng }, 
          title: `${cluster.points.length} sales in this area`, 
          map,
          icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
            scaledSize: new google.maps.Size(40, 40)
          },
          label: {
            text: cluster.points.length.toString(),
            color: 'white',
            fontSize: '12px',
            fontWeight: 'bold'
          }
        })
        
        const infoWindow = new google.maps.InfoWindow({ 
          content: `
            <div class="p-2">
              <h3 class="font-semibold text-lg">${cluster.points.length} Sales in This Area</h3>
              <div class="space-y-1">
                ${cluster.points.map(point => `
                  <div class="text-sm">
                    <a href="/sale/${point.id}" class="text-amber-600 hover:text-amber-700">
                      ${point.title}
                    </a>
                  </div>
                `).join('')}
              </div>
            </div>
          `
        })
        
        marker.addListener('click', () => {
          infoWindow.open({ map, anchor: marker })
        })
        
        newMarkers.push(marker)
        bounds.extend(marker.getPosition()!)
      }
    })

    setMarkers(newMarkers)

    logger.info('Map markers rendered', {
      component: 'YardSaleMap',
      operation: 'render_markers',
      markerCount: newMarkers.length,
      clusterCount: clusters.length,
      hasBounds: !bounds.isEmpty()
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds)
      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) map.setZoom(15)
        google.maps.event.removeListener(listener)
      })
    }
  }, [map, points])

  // Add "Near Me" button
  useEffect(() => {
    if (!map || !navigator.geolocation) return

    const btn = document.createElement('button')
    btn.textContent = '📍 Near Me'
    btn.className = 'bg-white px-3 py-2 rounded shadow hover:bg-neutral-50 font-medium text-sm'
    btn.style.margin = '8px'
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(btn)
    
    btn.onclick = () => {
      btn.textContent = '📍 Locating...'
      btn.disabled = true
      
      navigator.geolocation.getCurrentPosition(
        pos => {
          const center = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
          map.setCenter(center)
          map.setZoom(12)
          
          // Add user location marker
          new google.maps.Marker({ 
            position: center, 
            map, 
            title: 'Your Location',
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              scaledSize: new google.maps.Size(32, 32)
            }
          })
          
          btn.textContent = '📍 Near Me'
          btn.disabled = false
        },
        err => {
          console.error('Geolocation error:', err)
          alert('Unable to get your location. Please check your browser settings.')
          btn.textContent = '📍 Near Me'
          btn.disabled = false
        }
      )
    }

    return () => {
      // Cleanup button on unmount
      if (btn.parentNode) {
        btn.parentNode.removeChild(btn)
      }
    }
  }, [map])

  console.log('YardSaleMap: Render conditions:', { loading, error, pointsLength: points.length })
  
  if (loading) {
    console.log('YardSaleMap: Returning loading state')
    return (
      <div className="h-[60vh] w-full rounded-2xl bg-neutral-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-2"></div>
          <div className="text-neutral-600">Loading map...</div>
        </div>
      </div>
    )
  }

  if (error) {
    console.log('YardSaleMap: Returning error state:', error)
    return (
      <div className="h-[60vh] w-full rounded-2xl bg-neutral-200 flex items-center justify-center">
        <div className="text-center text-neutral-600">
          <div className="text-4xl mb-2">🗺️</div>
          <div className="font-medium">Failed to load map</div>
          <div className="text-sm mt-2">
            {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
              ? 'Google Maps API key not configured'
              : 'Please check your internet connection and try again'
            }
          </div>
        </div>
      </div>
    )
  }

  if (points.length === 0) {
    console.log('YardSaleMap: Returning no points state')
    return (
      <div className="h-[60vh] w-full rounded-2xl bg-neutral-200 flex items-center justify-center">
        <div className="text-center text-neutral-600">
          <div className="text-4xl mb-2">📍</div>
          <div>No sales with locations found</div>
          <div className="text-sm mt-2">Try adding some sales with addresses</div>
        </div>
      </div>
    )
  }

  console.log('YardSaleMap: Rendering map container div')
  return <div id="map" className="h-[60vh] w-full rounded-2xl bg-neutral-200" ref={ref} />
}
