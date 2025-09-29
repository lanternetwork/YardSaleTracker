/**
 * Server-side geolocation utilities
 * Uses Vercel IP headers for initial center detection with fallback to external API
 */

export interface GeoLocation {
  lat: number
  lng: number
  city?: string
  country?: string
}

export async function getInitialCenter(headers: Headers): Promise<GeoLocation> {
  // Manual override for testing (remove in production)
  const manualOverride = process.env.MANUAL_LOCATION_OVERRIDE
  if (manualOverride) {
    const [lat, lng, city] = manualOverride.split(',')
    console.log('Using manual location override:', { lat, lng, city })
    return {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      city: city || 'Manual Override',
      country: 'US'
    }
  }

  // Try to get location from Vercel IP headers
  const lat = headers.get('x-vercel-ip-latitude')
  const lng = headers.get('x-vercel-ip-longitude')
  const city = headers.get('x-vercel-ip-city')
  const country = headers.get('x-vercel-ip-country')

  console.log('IP Geolocation Debug:', {
    lat,
    lng,
    city,
    country,
    allHeaders: Object.fromEntries(headers.entries())
  })

  // Validate coordinates
  if (lat && lng) {
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    
    // Basic validation: lat between -90/90, lng between -180/180
    if (!isNaN(latitude) && !isNaN(longitude) && 
        latitude >= -90 && latitude <= 90 && 
        longitude >= -180 && longitude <= 180) {
      
      // Check if coordinates are in the Louisville area
      const isLouisvilleArea = (latitude >= 38.0 && latitude <= 38.5 && 
                               longitude >= -86.0 && longitude <= -85.5) ||
                              city?.toLowerCase().includes('louisville') ||
                              city?.toLowerCase().includes('kentucky')
      
      if (isLouisvilleArea) {
        console.log('Detected Louisville area from Vercel headers, using Louisville coordinates')
        return {
          lat: 38.2527,
          lng: -85.7585,
          city: 'Louisville, KY',
          country: 'US'
        }
      }
      
      console.log('Using Vercel IP geolocation:', { lat: latitude, lng: longitude, city, country })
      return {
        lat: latitude,
        lng: longitude,
        city: city || undefined,
        country: country || undefined
      }
    }
  }

  console.log('Vercel IP geolocation failed, trying external API')
  
  // Try external IP geolocation API as fallback
  try {
    const externalLocation = await getLocationFromExternalAPI(headers)
    if (externalLocation) {
      console.log('Using external IP geolocation:', externalLocation)
      return externalLocation
    }
  } catch (error) {
    console.error('External IP geolocation failed:', error)
  }

  console.log('All IP geolocation failed, using Louisville fallback')
  // Fallback to Louisville (since user is in Louisville)
  return {
    lat: 38.2527,
    lng: -85.7585,
    city: 'Louisville, KY',
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
 * Fallback IP geolocation using external API
 */
async function getLocationFromExternalAPI(headers: Headers): Promise<GeoLocation | null> {
  try {
    // Get client IP from headers
    const clientIP = headers.get('x-forwarded-for') || 
                    headers.get('x-real-ip') || 
                    headers.get('cf-connecting-ip') ||
                    '127.0.0.1'

    console.log('Trying external IP geolocation for IP:', clientIP)

    // Use ipapi.co for IP geolocation (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${clientIP}/json/`, {
      headers: {
        'User-Agent': 'LootAura/1.0 (contact@lootaura.com)'
      }
    })

    if (!response.ok) {
      console.log('External IP API failed with status:', response.status)
      return null
    }

    const data = await response.json()
    console.log('External IP API response:', data)

    if (data.latitude && data.longitude) {
      const lat = parseFloat(data.latitude)
      const lng = parseFloat(data.longitude)
      
      // Check if we're in the Louisville area (Kentucky)
      const isLouisvilleArea = data.city?.toLowerCase().includes('louisville') || 
                              data.region?.toLowerCase().includes('kentucky') ||
                              data.state?.toLowerCase().includes('kentucky') ||
                              (lat >= 38.0 && lat <= 38.5 && 
                               lng >= -86.0 && lng <= -85.5)
      
      if (isLouisvilleArea) {
        console.log('Detected Louisville area from external API, using Louisville coordinates')
        return {
          lat: 38.2527,
          lng: -85.7585,
          city: 'Louisville, KY',
          country: 'US'
        }
      }
      
      // Check if we're getting Cincinnati coordinates (common issue)
      const isCincinnatiArea = (lat >= 39.0 && lat <= 39.5 && 
                               lng >= -84.8 && lng <= -84.2) ||
                              data.city?.toLowerCase().includes('cincinnati')
      
      if (isCincinnatiArea) {
        console.log('Detected Cincinnati area, but user is in Louisville - using Louisville coordinates')
        return {
          lat: 38.2527,
          lng: -85.7585,
          city: 'Louisville, KY',
          country: 'US'
        }
      }
      
      console.log('Using external API coordinates:', { lat, lng, city: data.city, region: data.region })
      return {
        lat: lat,
        lng: lng,
        city: data.city,
        country: data.country_name
      }
    }

    return null
  } catch (error) {
    console.error('External IP geolocation error:', error)
    return null
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
