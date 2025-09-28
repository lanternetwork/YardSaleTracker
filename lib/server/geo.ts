/**
 * Server-side geolocation utilities
 * Uses Vercel IP headers for initial center detection
 */

export interface GeoLocation {
  lat: number
  lng: number
  city?: string
  country?: string
}

export function getInitialCenter(headers: Headers): GeoLocation {
  // Try to get location from Vercel IP headers
  const lat = headers.get('x-vercel-ip-latitude')
  const lng = headers.get('x-vercel-ip-longitude')
  const city = headers.get('x-vercel-ip-city')
  const country = headers.get('x-vercel-ip-country')

  // Validate coordinates
  if (lat && lng) {
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    
    // Basic validation: lat between -90/90, lng between -180/180
    if (!isNaN(latitude) && !isNaN(longitude) && 
        latitude >= -90 && latitude <= 90 && 
        longitude >= -180 && longitude <= 180) {
      return {
        lat: latitude,
        lng: longitude,
        city: city || undefined,
        country: country || undefined
      }
    }
  }

  // Fallback to center of US
  return {
    lat: 39.8283,
    lng: -98.5795,
    city: 'United States',
    country: 'US'
  }
}

/**
 * Calculate bounding box for radius-based queries
 */
export function calculateBoundingBox(centerLat: number, centerLng: number, radiusMi: number) {
  // Approximate miles per degree
  const latDelta = radiusMi / 69
  const lngDelta = radiusMi / (69 * Math.cos(centerLat * Math.PI / 180))
  
  return {
    latMin: centerLat - latDelta,
    latMax: centerLat + latDelta,
    lngMin: centerLng - lngDelta,
    lngMax: centerLng + lngDelta
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
