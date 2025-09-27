'use client'
import { useState, useEffect } from 'react'
import { maskLocation, getRevealCountdown } from '@/lib/privacy'

interface PrivacyPreviewProps {
  address: string
  lat: number
  lng: number
  privacy_mode: 'exact' | 'block_until_24h'
  date_start: string
  time_start?: string
}

export default function PrivacyPreview({ 
  address, 
  lat, 
  lng, 
  privacy_mode, 
  date_start, 
  time_start 
}: PrivacyPreviewProps) {
  const [masked, setMasked] = useState<any>(null)
  const [countdown, setCountdown] = useState<string>('')

  useEffect(() => {
    const maskedLocation = maskLocation({
      lat,
      lng,
      address,
      privacy_mode,
      date_start,
      time_start
    })
    
    setMasked(maskedLocation)
    
    if (maskedLocation.reveal_time) {
      const updateCountdown = () => {
        setCountdown(getRevealCountdown(maskedLocation.reveal_time!))
      }
      
      updateCountdown()
      const interval = setInterval(updateCountdown, 1000)
      
      return () => clearInterval(interval)
    }
  }, [address, lat, lng, privacy_mode, date_start, time_start])

  if (!masked) return null

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Privacy Preview</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-neutral-200 rounded-lg p-4">
          <h4 className="font-medium text-neutral-900 mb-2">Exact Location</h4>
          <p className="text-sm text-neutral-600 mb-2">{address}</p>
          <p className="text-xs text-neutral-500">
            Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
          </p>
        </div>
        
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <h4 className="font-medium text-blue-900 mb-2">Block-Level Privacy</h4>
          <p className="text-sm text-blue-700 mb-2">{masked.address}</p>
          <p className="text-xs text-blue-600">
            Coordinates: {masked.lat.toFixed(6)}, {masked.lng.toFixed(6)}
          </p>
        </div>
      </div>
      
      {masked.is_masked && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-blue-600 mr-2">🔒</div>
            <div>
              <div className="font-medium text-blue-800">Privacy Mode Active</div>
              <div className="text-sm text-blue-600">
                {countdown || 'Reveals in 24 hours'}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!masked.is_masked && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 mr-2">✓</div>
            <div>
              <div className="font-medium text-green-800">Location Revealed</div>
              <div className="text-sm text-green-600">
                Exact address is now visible to users
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
