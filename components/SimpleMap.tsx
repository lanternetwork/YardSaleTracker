'use client'

import { useEffect, useRef, useState } from 'react'

interface SimpleMarker {
  id: string
  title: string
  lat: number
  lng: number
  address?: string
}

interface SimpleMapProps {
  points: SimpleMarker[]
}

export default function SimpleMap({ points }: SimpleMapProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref.current) return

    // Simple map initialization
    const mapInstance = new google.maps.Map(ref.current, {
      center: { lat: 37.7749, lng: -122.4194 },
      zoom: 10,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    })

    setMap(mapInstance)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!map || !points.length) return

    console.log('SimpleMap: Adding markers for', points.length, 'points')

    // Clear existing markers
    const markers: google.maps.Marker[] = []
    
    points.forEach((point, index) => {
      console.log(`SimpleMap: Creating marker ${index + 1}:`, point.title)
      
      const marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: point.title
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div>
            <h3>${point.title}</h3>
            <p>${point.address || 'No address'}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map)
        infoWindow.setPosition(marker.getPosition()!)
      })

      markers.push(marker)
    })

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      markers.forEach(marker => {
        bounds.extend(marker.getPosition()!)
      })
      map.fitBounds(bounds)
    }

    console.log('SimpleMap: Created', markers.length, 'markers')
  }, [map, points])

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
    <div className="w-full h-96 border border-gray-300 rounded">
      <div ref={ref} className="w-full h-full" />
    </div>
  )
}
