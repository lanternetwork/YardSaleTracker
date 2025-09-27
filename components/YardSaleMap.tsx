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
  const ref = useRef<HTMLDivElement>(null)
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  
      // Debug points data
      console.log('YardSaleMap received points:', {
        count: points.length,
        points: points.map(p => ({ 
          id: p.id, 
          title: p.title, 
          lat: p.lat, 
          lng: p.lng, 
          address: p.address
        }))
      })
  
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
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured')
      setLoading(false)
      return
    }

    loader.load().then(() => {
      // Wait for DOM to be ready and retry if ref is not available
      let retryCount = 0
      const maxRetries = 50 // 5 seconds max
      
      const initializeMap = () => {
        if (!ref.current) {
          retryCount++
          if (retryCount > maxRetries) {
            setError('Map container not available')
            setLoading(false)
            return
          }
          setTimeout(initializeMap, 100)
          return
        }
        
        // Default center (US center) with reasonable zoom
        const defaultCenter = { lat: 39.8283, lng: -98.5795 }
        const defaultZoom = 4

        const mapInstance = new google.maps.Map(ref.current, { 
          center: defaultCenter,
          zoom: defaultZoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
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

        setMap(mapInstance)
        setLoading(false)
        
        // Add click listener to close info windows when clicking on map
        mapInstance.addListener('click', () => {
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close()
            activeInfoWindowRef.current = null
          }
        })
        
        // Add error listener to debug map issues
        mapInstance.addListener('tilesloaded', () => {
          console.log('Map tiles loaded successfully')
        })
        
        mapInstance.addListener('error', (error: any) => {
          console.error('Map error:', error)
        })
      }
      
      // Start the initialization process
      initializeMap()
    }).catch(err => {
      console.error('Error loading Google Maps:', err)
      setError('Failed to load map')
      setLoading(false)
    })
  }, [loader])

  // Update markers when points change
  useEffect(() => {
    if (!map) return

    // Close any active info window and reset state
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close()
      activeInfoWindowRef.current = null
    }

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: google.maps.Marker[] = []

    if (points.length === 0) {
      setMarkers([])
      return
    }

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
    
    // Enhanced clustering - group points that are reasonably close together
    const clusters: { center: { lat: number; lng: number }; points: typeof maskedPoints }[] = []
    const clusterRadius = 0.15 // ~15km in degrees - should cluster Oakland and SF
    
    // Sort points by latitude to improve clustering
    const sortedPoints = [...maskedPoints].sort((a, b) => a.lat - b.lat)
    
    sortedPoints.forEach((point, index) => {
      console.log(`Processing point ${index + 1}:`, {
        title: point.title,
        lat: point.lat,
        lng: point.lng,
        address: point.address
      })
      
      let addedToCluster = false
      
      // Check if this point is close to any existing cluster
      for (const cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(point.lat - cluster.center.lat, 2) + 
          Math.pow(point.lng - cluster.center.lng, 2)
        )
        
        console.log(`Distance to cluster:`, {
          clusterCenter: cluster.center,
          distance: distance,
          radius: clusterRadius,
          willCluster: distance < clusterRadius
        })
        
        if (distance < clusterRadius) {
          cluster.points.push(point)
          // Recalculate cluster center
          cluster.center.lat = cluster.points.reduce((sum, p) => sum + p.lat, 0) / cluster.points.length
          cluster.center.lng = cluster.points.reduce((sum, p) => sum + p.lng, 0) / cluster.points.length
          addedToCluster = true
          console.log(`Added to existing cluster. New cluster size: ${cluster.points.length}`)
          break
        }
      }
      
      if (!addedToCluster) {
        clusters.push({
          center: { lat: point.lat, lng: point.lng },
          points: [point]
        })
        console.log(`Created new cluster for: ${point.title}`)
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
              // Close any existing info window first
              if (activeInfoWindowRef.current) {
                activeInfoWindowRef.current.close()
                activeInfoWindowRef.current = null
              }
              // Open new info window and track it
              infoWindow.open({ map, anchor: marker })
              activeInfoWindowRef.current = infoWindow
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
        
        // Debug cluster click
        console.log('Cluster marker created:', {
          pointCount: cluster.points.length,
          titles: cluster.points.map(p => p.title),
          center: cluster.center
        })
        
        marker.addListener('click', () => {
          console.log('Cluster marker clicked:', {
            pointCount: cluster.points.length,
            titles: cluster.points.map(p => p.title)
          })
          // Close any existing info window first
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close()
            activeInfoWindowRef.current = null
          }
          // Open new info window and track it
          infoWindow.open({ map, anchor: marker })
          activeInfoWindowRef.current = infoWindow
        })
        
        newMarkers.push(marker)
        bounds.extend(marker.getPosition()!)
      }
    })

    setMarkers(newMarkers)

    // Debug clustering
    console.log('Clustering debug:', {
      totalPoints: maskedPoints.length,
      clusters: clusters.length,
      clusterDetails: clusters.map(c => ({
        pointCount: c.points.length,
        center: c.center,
        titles: c.points.map(p => p.title)
      })),
      allPoints: maskedPoints.map(p => ({
        title: p.title,
        lat: p.lat,
        lng: p.lng,
        address: p.address
      }))
    })

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

  // If we have points, render the map container even if still loading
  if (loading && points.length === 0) {
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

  return <div id="map" className="h-[60vh] w-full rounded-2xl bg-neutral-200" ref={ref} />
}
