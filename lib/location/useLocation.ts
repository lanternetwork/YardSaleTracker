'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCurrentLocation, checkGeolocationPermission, requestGeolocationPermission, type LocationResult, type LocationError } from './client'

export interface UseLocationState {
  location: LocationResult | null
  loading: boolean
  error: LocationError | null
  permissionGranted: boolean
}

export interface UseLocationActions {
  getLocation: () => Promise<void>
  requestPermission: () => Promise<boolean>
  clearError: () => void
}

export function useLocation(): UseLocationState & UseLocationActions {
  const [location, setLocation] = useState<LocationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<LocationError | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)

  // Check permission on mount
  useEffect(() => {
    checkGeolocationPermission().then(setPermissionGranted)
  }, [])

  const getLocation = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getCurrentLocation()
      setLocation(result)
      setPermissionGranted(true)
    } catch (err) {
      const error = err as LocationError
      setError(error)
      setPermissionGranted(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const granted = await requestGeolocationPermission()
      setPermissionGranted(granted)
      
      if (granted) {
        await getLocation()
      }
      
      return granted
    } catch (err) {
      const error = err as LocationError
      setError(error)
      setPermissionGranted(false)
      return false
    } finally {
      setLoading(false)
    }
  }, [getLocation])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    location,
    loading,
    error,
    permissionGranted,
    getLocation,
    requestPermission,
    clearError
  }
}

/**
 * Hook for location-based search with distance filtering
 */
export function useLocationSearch() {
  const { location, loading, error, getLocation, requestPermission, clearError } = useLocation()
  const [searchRadius, setSearchRadius] = useState(25) // km
  const [isSearching, setIsSearching] = useState(false)

  const searchWithLocation = useCallback(async (searchFunction: (params: { lat: number; lng: number; distanceKm: number }) => Promise<any>) => {
    if (!location) {
      throw new Error('No location available')
    }

    setIsSearching(true)
    try {
      const results = await searchFunction({
        lat: location.lat,
        lng: location.lng,
        distanceKm: searchRadius
      })
      return results
    } finally {
      setIsSearching(false)
    }
  }, [location, searchRadius])

  return {
    location,
    loading,
    error,
    searchRadius,
    isSearching,
    getLocation,
    requestPermission,
    clearError,
    setSearchRadius,
    searchWithLocation
  }
}
