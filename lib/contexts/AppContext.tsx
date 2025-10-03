'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Sale } from '@/lib/types'

interface AppContextType {
  location: { lat: number; lng: number; city?: string } | null
  preloadedSales: Sale[]
  isPreloading: boolean
  setLocation: (location: { lat: number; lng: number; city?: string } | null) => void
  setPreloadedSales: (sales: Sale[]) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<{ lat: number; lng: number; city?: string } | null>(null)
  const [preloadedSales, setPreloadedSales] = useState<Sale[]>([])
  const [isPreloading, setIsPreloading] = useState(false)
  
  console.log('[APP] AppProvider initialized')

  // Get location on app load
  useEffect(() => {
    async function getInitialLocation() {
      console.log('[APP] Starting location detection...')
      // First try to get location from cookie
      const cookieData = getCookie('la_loc')
      if (cookieData) {
        try {
          const locationData = JSON.parse(cookieData)
          if (locationData.lat && locationData.lng) {
            console.log(`[APP] Loading location from cookie: ${locationData.city}`)
            setLocation({
              lat: locationData.lat,
              lng: locationData.lng,
              city: locationData.city
            })
            return
          }
        } catch (error) {
          console.error('Failed to parse location cookie:', error)
        }
      }

      // Fallback to IP lookup
      try {
        console.log('[APP] Getting location from IP...')
        const res = await fetch('/api/geolocation/ip')
        if (res.ok) {
          const data = await res.json()
          if (data.ok && data.lat && data.lng) {
            console.log(`[APP] IP location found: ${data.city}`)
            setLocation({
              lat: data.lat,
              lng: data.lng,
              city: data.city
            })
          }
        }
      } catch (error) {
        console.error('IP geolocation failed:', error)
        // Set fallback location
        console.log('[APP] Using fallback location: Louisville')
        setLocation({
          lat: 38.2527,
          lng: -85.7585,
          city: 'Louisville'
        })
      }
    }

    getInitialLocation()
  }, [])

  // Pre-fetch sales when location is available
  useEffect(() => {
    if (location && preloadedSales.length === 0) {
      async function preloadSales() {
        setIsPreloading(true)
        try {
          console.log(`[APP] Pre-fetching sales for ${location?.city || 'your area'}...`)
          const response = await fetch(`/api/sales?lat=${location!.lat}&lng=${location!.lng}&distanceKm=40.2335&limit=24`)
          const data = await response.json()
          
          if (data.ok && data.data) {
            console.log(`[APP] Pre-loaded ${data.data.length} sales`)
            setPreloadedSales(data.data)
          }
        } catch (error) {
          console.error('Failed to pre-load sales:', error)
        } finally {
          setIsPreloading(false)
        }
      }

      preloadSales()
    }
  }, [location, preloadedSales.length])

  return (
    <AppContext.Provider value={{
      location,
      preloadedSales,
      isPreloading,
      setLocation,
      setPreloadedSales
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Cookie utility function
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}
