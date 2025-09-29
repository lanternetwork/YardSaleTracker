/**
 * Location center utilities with preference order and persistence
 * Preference: URL → cookie → account home ZIP → IP headers → fallback
 */

export interface LocationCenter {
  lat: number
  lng: number
  radius: number
  zip?: string
  source: 'url' | 'cookie' | 'account' | 'ip' | 'fallback'
  city?: string
}

export interface CenterOptions {
  headers?: Headers
  url?: URL
  cookies?: { [key: string]: string }
  user?: { id: string; home_zip?: string } | null
}

/**
 * Get initial center using preference order
 */
export async function getInitialCenter(options: CenterOptions): Promise<LocationCenter> {
  const { headers, url, cookies, user } = options

  // 1. URL parameters (highest priority)
  if (url) {
    const urlCenter = getCenterFromURL(url)
    if (urlCenter) {
      console.log('Using center from URL:', urlCenter)
      return urlCenter
    }
  }

  // 2. Cookie/localStorage (server-side cookie wins)
  if (cookies) {
    const cookieCenter = getCenterFromCookie(cookies)
    if (cookieCenter) {
      console.log('Using center from cookie:', cookieCenter)
      return cookieCenter
    }
  }

  // 3. Account home ZIP (if user is authenticated and has home_zip)
  if (user?.home_zip) {
    try {
      const accountCenter = await getCenterFromAccountZIP(user.home_zip)
      if (accountCenter) {
        console.log('Using center from account home ZIP:', accountCenter)
        return accountCenter
      }
    } catch (error) {
      console.error('Failed to geocode account home ZIP:', error)
    }
  }

  // 4. IP headers (Vercel geolocation)
  if (headers) {
    const ipCenter = getCenterFromIP(headers)
    if (ipCenter) {
      console.log('Using center from IP headers:', ipCenter)
      return ipCenter
    }
  }

  // 5. Fallback to US center
  console.log('Using fallback center (US center)')
  return {
    lat: 39.8283,
    lng: -98.5795,
    radius: 25,
    source: 'fallback',
    city: 'United States'
  }
}

/**
 * Extract center from URL parameters
 */
function getCenterFromURL(url: URL): LocationCenter | null {
  const lat = url.searchParams.get('lat')
  const lng = url.searchParams.get('lng')
  const zip = url.searchParams.get('zip')
  const radius = url.searchParams.get('radius')

  if (lat && lng) {
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    
    if (!isNaN(latitude) && !isNaN(longitude) && 
        latitude >= -90 && latitude <= 90 && 
        longitude >= -180 && longitude <= 180) {
      return {
        lat: latitude,
        lng: longitude,
        radius: radius ? parseFloat(radius) : 25,
        zip: zip || undefined,
        source: 'url'
      }
    }
  }

  return null
}

/**
 * Extract center from cookie
 */
function getCenterFromCookie(cookies: { [key: string]: string }): LocationCenter | null {
  const cookieValue = cookies['la_center']
  if (!cookieValue) return null

  try {
    const data = JSON.parse(cookieValue)
    
    // Check if cookie is still valid (90 days TTL)
    const now = Date.now()
    const cookieTime = data.ts || 0
    const maxAge = 90 * 24 * 60 * 60 * 1000 // 90 days in milliseconds
    
    if (now - cookieTime > maxAge) {
      console.log('Cookie expired, ignoring')
      return null
    }

    if (data.lat && data.lng) {
      return {
        lat: data.lat,
        lng: data.lng,
        radius: data.radius || 25,
        zip: data.zip,
        source: 'cookie',
        city: data.city
      }
    }
  } catch (error) {
    console.error('Failed to parse center cookie:', error)
  }

  return null
}

/**
 * Get center from account home ZIP (server-side geocoding)
 */
async function getCenterFromAccountZIP(homeZip: string): Promise<LocationCenter | null> {
  try {
    // Use existing ZIP geocode API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/geocode/zip?zip=${homeZip}`, {
      headers: {
        'User-Agent': 'LootAura/1.0 (server-side geocoding)'
      }
    })

    if (!response.ok) {
      console.error('Failed to geocode account home ZIP:', response.status)
      return null
    }

    const data = await response.json()
    if (data.lat && data.lng) {
      return {
        lat: data.lat,
        lng: data.lng,
        radius: 25,
        zip: homeZip,
        source: 'account',
        city: data.city
      }
    }
  } catch (error) {
    console.error('Error geocoding account home ZIP:', error)
  }

  return null
}

/**
 * Get center from IP headers
 */
function getCenterFromIP(headers: Headers): LocationCenter | null {
  const lat = headers.get('x-vercel-ip-latitude')
  const lng = headers.get('x-vercel-ip-longitude')
  const city = headers.get('x-vercel-ip-city')
  const country = headers.get('x-vercel-ip-country')

  if (lat && lng) {
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    
    if (!isNaN(latitude) && !isNaN(longitude) && 
        latitude >= -90 && latitude <= 90 && 
        longitude >= -180 && longitude <= 180) {
      
      // Check if coordinates are in the Louisville area
      const isLouisvilleArea = (latitude >= 38.0 && latitude <= 38.5 && 
                               longitude >= -86.0 && longitude <= -85.5) ||
                              city?.toLowerCase().includes('louisville') ||
                              city?.toLowerCase().includes('kentucky')
      
      if (isLouisvilleArea) {
        return {
          lat: 38.2527,
          lng: -85.7585,
          radius: 25,
          source: 'ip',
          city: 'Louisville, KY'
        }
      }
      
      // Check if we're getting Cincinnati coordinates (common issue)
      const isCincinnatiArea = (latitude >= 39.0 && latitude <= 39.5 && 
                               longitude >= -84.8 && longitude <= -84.2) ||
                              city?.toLowerCase().includes('cincinnati')
      
      if (isCincinnatiArea) {
        return {
          lat: 38.2527,
          lng: -85.7585,
          radius: 25,
          source: 'ip',
          city: 'Louisville, KY'
        }
      }
      
      return {
        lat: latitude,
        lng: longitude,
        radius: 25,
        source: 'ip',
        city: city || undefined
      }
    }
  }

  return null
}

/**
 * Create center cookie value
 */
export function createCenterCookie(center: LocationCenter): string {
  return JSON.stringify({
    lat: center.lat,
    lng: center.lng,
    radius: center.radius,
    zip: center.zip,
    city: center.city,
    ts: Date.now()
  })
}

/**
 * Update center in URL and cookie
 */
export function updateCenter(center: LocationCenter, url: URL): { newUrl: string; cookieValue: string } {
  const newUrl = new URL(url)
  
  // Update URL parameters
  newUrl.searchParams.set('lat', center.lat.toString())
  newUrl.searchParams.set('lng', center.lng.toString())
  newUrl.searchParams.set('radius', center.radius.toString())
  if (center.zip) {
    newUrl.searchParams.set('zip', center.zip)
  } else {
    newUrl.searchParams.delete('zip')
  }

  // Create cookie value
  const cookieValue = createCenterCookie(center)

  return { newUrl: newUrl.toString(), cookieValue }
}
