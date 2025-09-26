// Geocoding utilities with caching to avoid repeated API calls

export interface GeocodeResult {
  lat: number
  lng: number
  formatted_address: string
  city?: string
  state?: string
  zip?: string
}

// Simple in-memory cache (in production, use Redis or database)
// Cache is scoped by provider to avoid cross-provider pollution in tests
const geocodeCache = new Map<string, GeocodeResult>()

function cacheKey(provider: 'google' | 'nominatim', address: string): string {
  return `${provider}:${address.toLowerCase()}`
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const hasGoogle = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (hasGoogle) {
      const cachedGoogle = geocodeCache.get(cacheKey('google', address))
      if (cachedGoogle) return cachedGoogle

      const googleResult = await geocodeWithGoogle(address)
      if (googleResult) {
        geocodeCache.set(cacheKey('google', address), googleResult)
        return googleResult
      }
    }

    const cachedNominatim = geocodeCache.get(cacheKey('nominatim', address))
    if (cachedNominatim) return cachedNominatim

    const nominatimResult = await geocodeWithNominatim(address)
    if (nominatimResult) {
      geocodeCache.set(cacheKey('nominatim', address), nominatimResult)
      return nominatimResult
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

export async function geocodeWithGoogle(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
  )
  
  const data = await response.json()
  
  if (data.results && data.results.length > 0) {
    const result = data.results[0]
    const location = result.geometry.location
    
    // Extract address components
    const components = result.address_components || []
    const city = components.find((c: any) => c.types.includes('locality'))?.long_name
    const state = components.find((c: any) => c.types.includes('administrative_area_level_1'))?.short_name
    const zip = components.find((c: any) => c.types.includes('postal_code'))?.long_name

    return {
      lat: location.lat,
      lng: location.lng,
      formatted_address: result.formatted_address,
      city,
      state,
      zip
    }
  }

  return null
}

export async function geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
  const email = process.env.NOMINATIM_APP_EMAIL || 'noreply@yardsalefinder.com'
  
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&email=${encodeURIComponent(email)}&limit=1`,
    {
      headers: {
        'User-Agent': 'LootAura Test Suite',
        'Accept': 'application/json',
        'Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://yardsalefinder.com',
      },
    }
  )
  
  const data = await response.json()
  
  if (data && data.length > 0) {
    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formatted_address: result.display_name,
      city: result.address?.city || result.address?.town,
      state: result.address?.state,
      zip: result.address?.postcode
    }
  }

  return null
}

export function clearGeocodeCache() {
  geocodeCache.clear()
}
