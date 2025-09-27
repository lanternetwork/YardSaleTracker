'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import ClusterPreview from './ClusterPreview'
import ClusterAllModal from './ClusterAllModal'
import { Sale } from '@/types/sale'

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

interface Cluster {
  center: { lat: number; lng: number }
  markers: google.maps.Marker[]
  sales: Sale[]
  bounds: google.maps.LatLngBounds
}

export default function CustomClusteredMap({ points }: { points: Marker[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [saleMap, setSaleMap] = useState<Map<string, Sale>>(new Map())
  
  // Cluster preview state
  const [previewSales, setPreviewSales] = useState<Sale[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalSales, setModalSales] = useState<Sale[]>([])

  console.log('CustomClusteredMap received points:', {
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

  // Debug ref changes
  useEffect(() => {
    console.log('CustomClusteredMap mounted, ref.current:', !!ref.current)
  }, [])

  useEffect(() => {
    console.log('Ref changed, ref.current:', !!ref.current)
  }, [ref.current])

  // Initialize map
  useEffect(() => {
    console.log('Google Maps API Key check:', {
      hasKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      keyLength: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length || 0,
      keyPrefix: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) || 'none'
    })
    
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key not configured')
      setLoading(false)
      return
    }

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      loader.load().then(() => {
        console.log('Google Maps loader loaded successfully')
        // Wait for DOM to be ready and retry if ref is not available
        let retryCount = 0
        const maxRetries = 50 // 5 seconds max
      
        const initializeMap = () => {
          console.log('Attempting to initialize map, retry count:', retryCount, 'ref.current:', !!ref.current)
          if (!ref.current) {
            retryCount++
            if (retryCount > maxRetries) {
              setError('Map container not available after retries')
              setLoading(false)
              return
            }
            setTimeout(initializeMap, 100)
            return
          }

        try {
          const mapInstance = new google.maps.Map(ref.current, {
            center: { lat: 37.7749, lng: -122.4194 },
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true
          })

          setMap(mapInstance)
          setLoading(false)
          console.log('Map initialized successfully')
        } catch (err) {
          console.error('Error initializing map:', err)
          setError(`Failed to initialize map: ${err}`)
          setLoading(false)
        }
      }
      
      // Start the initialization process
      initializeMap()
    }).catch(err => {
      console.error('Error loading Google Maps:', err)
      console.error('Google Maps error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      })
      setError(`Failed to load map: ${err.message}`)
      setLoading(false)
    })
    }, 100)

    return () => clearTimeout(timer)
  }, [loader])

  // Custom clustering algorithm
  const createClusters = (markers: google.maps.Marker[], sales: Sale[]): Cluster[] => {
    if (markers.length === 0) return []

    const clusterRadiusKm = 20 // 20km radius to ensure Oakland and SF cluster
    const clusters: Cluster[] = []
    const processed = new Set<google.maps.Marker>()

    // Helper function to calculate distance between two points in km
    const getDistanceKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371 // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      return R * c
    }

    markers.forEach(marker => {
      if (processed.has(marker)) return

      const position = marker.getPosition()
      if (!position) return

      const clusterMarkers: google.maps.Marker[] = [marker]
      const clusterSales: Sale[] = []
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(position)

      // Find nearby markers
      markers.forEach(otherMarker => {
        if (otherMarker === marker || processed.has(otherMarker)) return

        const otherPosition = otherMarker.getPosition()
        if (!otherPosition) return

        const distanceKm = getDistanceKm(
          position.lat(), position.lng(),
          otherPosition.lat(), otherPosition.lng()
        )

        console.log(`Distance between markers: ${distanceKm.toFixed(2)}km (threshold: ${clusterRadiusKm}km)`)

        if (distanceKm < clusterRadiusKm) {
          console.log(`Markers are close enough to cluster!`)
          clusterMarkers.push(otherMarker)
          bounds.extend(otherPosition)
          processed.add(otherMarker)
        }
      })

      processed.add(marker)

      console.log(`Cluster found: ${clusterMarkers.length} markers at (${position.lat()}, ${position.lng()})`)

      // Get sales for this cluster
      clusterMarkers.forEach(m => {
        const saleId = (m as any).get('saleId')
        const sale = sales.find(s => s.id === saleId)
        if (sale) clusterSales.push(sale)
      })

      // Calculate cluster center
      const center = {
        lat: clusterMarkers.reduce((sum, m) => sum + m.getPosition()!.lat(), 0) / clusterMarkers.length,
        lng: clusterMarkers.reduce((sum, m) => sum + m.getPosition()!.lng(), 0) / clusterMarkers.length
      }

      clusters.push({
        center,
        markers: clusterMarkers,
        sales: clusterSales,
        bounds
      })
    })

    return clusters
  }

  // Update markers when points change
  useEffect(() => {
    if (!map) return

    console.log('Updating markers for', points.length, 'points')

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    setMarkers([])
    setClusters([])

    if (points.length === 0) {
      console.log('No points to display')
      return
    }

    // Create new markers
    const newMarkers: google.maps.Marker[] = []
    const newSaleMap = new Map<string, Sale>()

    points.forEach((point, index) => {
      console.log(`Creating marker ${index + 1}:`, point.title)
      
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: point.title
      })

      // Store sale data on marker for cluster access
      const sale: Sale = {
        id: point.id,
        title: point.title,
        address: point.address,
        date_start: point.date_start,
        time_start: point.time_start
      }
      
      ;(marker as any).set('saleId', point.id)
      ;(marker as any).set('sale', sale)
      newSaleMap.set(point.id, sale)

      newMarkers.push(marker)
    })

    setMarkers(newMarkers)
    setSaleMap(newSaleMap)

    // Create clusters
    const newClusters = createClusters(newMarkers, Array.from(newSaleMap.values()))
    setClusters(newClusters)

    // Create cluster markers
    newClusters.forEach((cluster, index) => {
      if (cluster.markers.length === 1) {
        // Single marker - add click handler
        const marker = cluster.markers[0]
        marker.addListener('click', () => {
          console.log('Single marker clicked:', (marker as any).getTitle())
          setPreviewSales(cluster.sales)
          setPreviewTotal(cluster.sales.length)
          setShowPreview(true)
        })
      } else {
        // Cluster marker
        const clusterMarker = new google.maps.Marker({
          position: cluster.center,
          map: map,
          title: `${cluster.markers.length} sales in this area`,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
              <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="18" fill="#4285F4" stroke="#fff" stroke-width="2"/>
                <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">${cluster.markers.length}</text>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(40, 40),
            anchor: new (google.maps as any).Point(20, 20)
          }
        })

        clusterMarker.addListener('click', () => {
          console.log('Cluster clicked:', cluster.markers.length, 'markers')
          setPreviewSales(cluster.sales.slice(0, 10))
          setPreviewTotal(cluster.sales.length)
          setShowPreview(true)
        })

        // Hide individual markers in cluster
        cluster.markers.forEach(marker => marker.setMap(null))
      }
    })

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition()!)
      })
      map.fitBounds(bounds)
    }

    console.log('Markers updated:', newMarkers.length, 'clusters:', newClusters.length)

  }, [map, points])

  // Preview handlers
  const handleViewAll = () => {
    setModalSales(previewSales.length === previewTotal ? previewSales : 
      Array.from(saleMap.values()).filter(sale => 
        previewSales.some(p => p.id === sale.id)
      ))
    setShowModal(true)
    setShowPreview(false)
  }

  const handleZoomToCluster = () => {
    if (!map || previewSales.length === 0) return

    const bounds = new google.maps.LatLngBounds()
    previewSales.forEach(sale => {
      const point = points.find(p => p.id === sale.id)
      if (point) {
        bounds.extend(new google.maps.LatLng(point.lat, point.lng))
      }
    })
    
    map.fitBounds(bounds)
    setShowPreview(false)
  }

  const handleClosePreview = () => {
    setShowPreview(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  return (
    <div className="relative">
      <div className="w-full h-96 border border-gray-300 rounded">
        <div ref={ref} className="w-full h-full" />
        {loading && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center">
            <p className="text-gray-600">Loading map...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 bg-red-100 bg-opacity-90 flex items-center justify-center">
            <p className="text-red-600">Map Error: {error}</p>
          </div>
        )}
      </div>
      
      {showPreview && (
        <ClusterPreview
          sales={previewSales}
          total={previewTotal}
          onViewAll={handleViewAll}
          onZoomToCluster={handleZoomToCluster}
          onClose={handleClosePreview}
        />
      )}
      
      {showModal && (
        <ClusterAllModal
          sales={modalSales}
          open={showModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}
