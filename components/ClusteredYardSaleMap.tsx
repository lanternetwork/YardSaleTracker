'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import ClusterPreview from './ClusterPreview'
import ClusterAllModal from './ClusterAllModal'

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

interface Sale {
  id: string
  title: string
  description?: string
  address?: string
  city?: string
  state?: string
  start_at?: string
  date_start?: string
  time_start?: string
  end_at?: string
  date_end?: string
  time_end?: string
  tags?: string[]
  photos?: string[]
}

export default function ClusteredYardSaleMap({ points }: { points: Marker[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [clusterer, setClusterer] = useState<MarkerClusterer | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [saleMap, setSaleMap] = useState<Map<string, Sale>>(new Map())
  
  // Cluster preview state
  const [previewSales, setPreviewSales] = useState<Sale[]>([])
  const [previewTotal, setPreviewTotal] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalSales, setModalSales] = useState<Sale[]>([])

  console.log('ClusteredYardSaleMap received points:', {
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

    loader.load().then(() => {
      console.log('Google Maps loader loaded successfully')
      // Wait for DOM to be ready and retry if ref is not available
      let retryCount = 0
      const maxRetries = 50 // 5 seconds max
      
      const initializeMap = () => {
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
  }, [loader])

  // Initialize clusterer when map is ready
  useEffect(() => {
    if (!map) return

    const newClusterer = new MarkerClusterer({
      map,
      algorithm: new MarkerClusterer.SuperClusterAlgorithm({
        radius: 80,
        maxZoom: 17,
        minPoints: 2
      })
    })

    setClusterer(newClusterer)
    console.log('Clusterer initialized')

    return () => {
      if (newClusterer) {
        newClusterer.clearMarkers()
      }
    }
  }, [map])

  // Update markers when points change
  useEffect(() => {
    if (!map || !clusterer) return

    console.log('Updating markers for', points.length, 'points')

    // Clear existing markers
    clusterer.clearMarkers()
    setMarkers([])

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
      
      marker.set('sale', sale)
      newSaleMap.set(point.id, sale)

      // Single marker click handler
      marker.addListener('click', () => {
        console.log('Single marker clicked:', point.title)
        // For single markers, we could show an info window or preview
        // For now, just log - clustering will handle most interactions
      })

      newMarkers.push(marker)
    })

    // Add markers to clusterer
    clusterer.addMarkers(newMarkers)
    setMarkers(newMarkers)
    setSaleMap(newSaleMap)

    // Fit bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      newMarkers.forEach(marker => {
        bounds.extend(marker.getPosition()!)
      })
      map.fitBounds(bounds)
    }

    console.log('Markers updated:', newMarkers.length)

    // Cluster click handler
    clusterer.addListener('clusterclick', (event: any) => {
      console.log('Cluster clicked:', event)
      
      const cluster = event.cluster
      const clusterMarkers = cluster.markers
      const clusterSales: Sale[] = []

      clusterMarkers.forEach((marker: google.maps.Marker) => {
        const sale = marker.get('sale')
        if (sale) {
          clusterSales.push(sale)
        }
      })

      // Sort by date/time
      clusterSales.sort((a, b) => {
        const dateA = new Date(a.date_start || a.start_at || '')
        const dateB = new Date(b.date_start || b.start_at || '')
        return dateA.getTime() - dateB.getTime()
      })

      console.log('Cluster sales:', clusterSales.length, clusterSales.map(s => s.title))

      // Show preview with first 10
      setPreviewSales(clusterSales.slice(0, 10))
      setPreviewTotal(clusterSales.length)
      setShowPreview(true)
    })

  }, [map, clusterer, points])

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
        bounds.extend({ lat: point.lat, lng: point.lng })
      }
    })
    
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
    setShowPreview(false)
  }

  const handleClosePreview = () => {
    setShowPreview(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-red-100 border border-red-300 rounded flex items-center justify-center">
        <p className="text-red-600">Map Error: {error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="w-full h-96 border border-gray-300 rounded">
        <div ref={ref} className="w-full h-full" />
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
