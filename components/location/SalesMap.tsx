'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Map, { Marker, Popup } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import Supercluster from 'supercluster'
import { Sale } from '@/lib/types'
import { formatLocation } from '@/lib/location/client'
import { getMapboxToken } from '@/lib/maps/token'
import { incMapLoad } from '@/lib/usageLogs'

interface SalesMapProps {
  sales: Sale[]
  center?: { lat: number; lng: number }
  zoom?: number
  onSaleClick?: (sale: Sale) => void
  selectedSaleId?: string
}

export default function SalesMap({ 
  sales, 
  center = { lat: 38.2527, lng: -85.7585 }, 
  zoom = 10,
  onSaleClick,
  selectedSaleId
}: SalesMapProps) {
  useEffect(() => {
    incMapLoad()
  }, [])
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [viewState, setViewState] = useState({
    latitude: center.lat,
    longitude: center.lng,
    zoom: zoom
  })

  // Initialize supercluster
  const clusterIndex = useMemo(() => {
    console.log('[SalesMap] Processing sales data:')
    console.log('  - Total sales:', sales.length)
    console.log('  - Sales with coords:', sales.filter(sale => sale.lat && sale.lng).length)
    console.log('  - Sample sale:', sales[0])
    console.log('  - All sales:', sales)
    
    const index = new Supercluster({
      radius: 40, // Cluster radius in pixels
      maxZoom: 16, // Max zoom level for clustering
      minZoom: 0, // Min zoom level for clustering
      minPoints: 2, // Minimum points to form a cluster
    })
    
    // Prepare points for clustering
    const points = sales
      .filter(sale => sale.lat && sale.lng)
      .map(sale => ({
        type: 'Feature' as const,
        properties: { 
          id: sale.id,
          title: sale.title,
          city: sale.city,
          state: sale.state,
          date_start: sale.date_start,
          time_start: sale.time_start,
          price: sale.price,
          tags: sale.tags,
          is_featured: sale.is_featured,
          sale: sale // Store the full sale object
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [sale.lng!, sale.lat!]
        }
      }))
    
    index.load(points)
    return index
  }, [sales])

  // Get clusters and individual points for current view
  const { clusters, individualPoints } = useMemo(() => {
    const bounds: [number, number, number, number] = [
      viewState.longitude - 0.1, // west
      viewState.latitude - 0.1,  // south
      viewState.longitude + 0.1, // east
      viewState.latitude + 0.1   // north
    ]
    
    const clusters = clusterIndex.getClusters(bounds, Math.floor(viewState.zoom))
    const individualPoints = clusters.filter(cluster => !cluster.properties.cluster)
    
    console.log('[SalesMap] Clusters generated:')
    console.log('  - Total clusters:', clusters.length)
    console.log('  - Individual points:', individualPoints.length)
    console.log('  - View state:', viewState)
    console.log('  - Bounds:', bounds)
    console.log('  - Clusters:', clusters)
    
    return { clusters, individualPoints }
  }, [clusterIndex, viewState])

  // Update view state when center changes
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      latitude: center.lat,
      longitude: center.lng
    }))
  }, [center.lat, center.lng])

  const handleMarkerClick = (sale: Sale) => {
    setSelectedSale(sale)
    if (onSaleClick) {
      onSaleClick(sale)
    }
  }

  const handleClusterClick = (cluster: any) => {
    // Zoom in on cluster
    const expansionZoom = Math.min(
      clusterIndex.getClusterExpansionZoom(cluster.id),
      20
    )
    
    setViewState(prev => ({
      ...prev,
      latitude: cluster.geometry.coordinates[1],
      longitude: cluster.geometry.coordinates[0],
      zoom: expansionZoom
    }))
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

  // Token via util for flexibility
  const token = getMapboxToken()
  console.log('[SalesMap] Mapbox token check:')
  console.log('  - Has token:', !!token)
  console.log('  - Token length:', token.length)
  console.log('  - Token (first 10 chars):', token.substring(0, 10))
  
  if (!token) {
    return (
      <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-600">Mapbox token missing. Set NEXT_PUBLIC_MAPBOX_TOKEN in Vercel for this environment.</p>
      </div>
    )
  }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden">
      <Map
        mapboxAccessToken={token}
        initialViewState={viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates
          const isCluster = cluster.properties.cluster
          
          if (isCluster) {
            // Render cluster marker
            return (
              <Marker
                key={`cluster-${cluster.id}`}
                latitude={latitude}
                longitude={longitude}
                onClick={() => handleClusterClick(cluster)}
              >
                <div className="cursor-pointer transition-transform duration-200 hover:scale-110">
                  <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold bg-orange-500 text-white">
                    {cluster.properties.point_count}
                  </div>
                </div>
              </Marker>
            )
          } else {
            // Render individual sale marker
            const sale = cluster.properties.sale
            return (
              <Marker
                key={sale.id}
                latitude={latitude}
                longitude={longitude}
                onClick={() => handleMarkerClick(sale)}
              >
                <div className={`cursor-pointer ${
                  selectedSaleId === sale.id ? 'scale-125' : 'scale-100'
                } transition-transform duration-200`}>
                  <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold ${
                    sale.is_featured 
                      ? 'bg-red-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    $
                  </div>
                </div>
              </Marker>
            )
          }
        })}

        {selectedSale && (
          <Popup
            latitude={selectedSale.lat || 0}
            longitude={selectedSale.lng || 0}
            onClose={() => setSelectedSale(null)}
            closeButton={true}
            closeOnClick={false}
            anchor="bottom"
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold text-lg mb-2">{selectedSale.title}</h3>
              
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  📍 {selectedSale.city}, {selectedSale.state}
                </p>
                
                <p className="text-gray-600">
                  📅 {formatDate(selectedSale.date_start)} at {formatTime(selectedSale.time_start)}
                </p>
                
                {selectedSale.price !== null && selectedSale.price !== undefined && (
                  <p className="text-green-600 font-semibold">
                    💰 {selectedSale.price === 0 ? 'Free' : `$${selectedSale.price}`}
                  </p>
                )}
                
                {selectedSale.tags && selectedSale.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedSale.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {selectedSale.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{selectedSale.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-3 pt-2 border-t">
                <a
                  href={`/sales/${selectedSale.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Details →
                </a>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
