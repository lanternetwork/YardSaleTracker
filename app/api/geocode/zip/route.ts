import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface GeocodeResult {
  lat: number
  lng: number
  zip: string
  city?: string
  state?: string
  country?: string
}

// Simple in-memory rate limiter and cache
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const geocodeCache = new Map<string, { result: GeocodeResult; timestamp: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const key = ip
  
  const current = rateLimitMap.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (current.count >= RATE_LIMIT) {
    return false
  }
  
  current.count++
  return true
}

function getCachedResult(zip: string): GeocodeResult | null {
  const cached = geocodeCache.get(zip)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result
  }
  return null
}

function setCachedResult(zip: string, result: GeocodeResult): void {
  geocodeCache.set(zip, { result, timestamp: Date.now() })
}

export async function GET(request: NextRequest) {
  try {
    // Basic rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }
    
    const { searchParams } = new URL(request.url)
    const zip = searchParams.get('zip')
    const country = searchParams.get('country') || 'US'
    
    if (!zip) {
      return NextResponse.json({ error: 'ZIP code is required' }, { status: 400 })
    }
    
    console.log(`Geocoding request for ZIP ${zip}, country ${country}`)
    
    // Validate US ZIP format
    if (country === 'US' && !/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: 'Invalid US ZIP code format' }, { status: 400 })
    }
    
    // Check for known PO Box ZIP codes and provide fallback locations
    const poBoxZips: { [key: string]: { lat: number; lng: number; city: string; state: string } } = {
      '90078': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' },
      '90079': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' },
      '90080': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' },
      '90081': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' },
      '90082': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' },
      '90083': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' },
      '90084': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' },
      '90085': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' },
      '90086': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' },
      '90087': { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' }
    }
    
    if (country === 'US' && poBoxZips[zip]) {
      console.log(`ZIP ${zip} is a known PO Box-only ZIP code, using fallback location`)
      const fallbackLocation = poBoxZips[zip]
      
      const geocodeResult: GeocodeResult = {
        lat: fallbackLocation.lat,
        lng: fallbackLocation.lng,
        zip,
        city: fallbackLocation.city,
        state: fallbackLocation.state,
        country: 'US'
      }
      
      // Cache the result
      setCachedResult(zip, geocodeResult)
      
      return NextResponse.json(geocodeResult)
    }
    
    // Check cache first
    const cached = getCachedResult(zip)
    if (cached) {
      console.log(`Cache hit for ZIP ${zip}`)
      return NextResponse.json(cached)
    }
    
    console.log(`Cache miss for ZIP ${zip}, fetching from Nominatim`)
    
    // Try multiple search approaches - prioritize US results
    const searchQueries = [
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=${country}&format=json&limit=5`,
      `https://nominatim.openstreetmap.org/search?postalcode=${zip}&format=json&limit=5`,
      `https://nominatim.openstreetmap.org/search?q=${zip}&country=${country}&format=json&limit=5`
    ]
    
    let data: any[] = []
    let lastError: Error | null = null
    
    for (let i = 0; i < searchQueries.length; i++) {
      const url = searchQueries[i]
      console.log(`Trying search approach ${i + 1} for ZIP ${zip}: ${url}`)
      
      const startTime = Date.now()
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'LootAura/1.0 (contact@lootaura.com)'
          }
        })
        
        const fetchTime = Date.now() - startTime
        console.log(`Nominatim request ${i + 1} took ${fetchTime}ms`)
        
        if (!response.ok) {
          console.log(`Request ${i + 1} failed with status: ${response.status}`)
          continue
        }
        
        const responseData = await response.json()
        console.log(`Nominatim response ${i + 1} for ZIP ${zip}:`, {
          status: response.status,
          dataLength: responseData?.length || 0,
          firstResult: responseData?.[0] || null,
          allResults: responseData
        })
        
        if (responseData && responseData.length > 0) {
          // Filter for US results if country is US
          if (country === 'US') {
            const usResults = responseData.filter((result: any) => {
              // Check for explicit US indicators
              const isExplicitUS = result.address?.country_code === 'us' || 
                                  result.address?.country === 'United States' ||
                                  result.display_name?.includes('United States')
              
              // For US ZIP codes, also accept results without explicit country info
              // if they have US state codes or are from the first search approach (which includes country=US)
              const isLikelyUS = i === 0 || // First approach includes country=US
                               result.address?.state_code?.length === 2 || // US state codes are 2 letters
                               result.address?.state?.length > 0 // Has a state field
              
              const isUS = isExplicitUS || isLikelyUS
              console.log(`Result filtering for approach ${i + 1}:`, {
                result: result.display_name,
                address: result.address,
                isExplicitUS,
                isLikelyUS,
                isUS
              })
              
              return isUS
            })
            
            if (usResults.length > 0) {
              data = usResults
              console.log(`Found ${usResults.length} US results with approach ${i + 1}`)
              break
            } else {
              console.log(`No US results found with approach ${i + 1}, trying next approach`)
              continue
            }
          } else {
            data = responseData
            console.log(`Found results with approach ${i + 1}`)
            break
          }
        }
      } catch (error) {
        console.log(`Request ${i + 1} failed with error:`, error)
        lastError = error as Error
        continue
      }
    }
    
    if (!data || data.length === 0) {
      console.log(`No results found for ZIP ${zip} with any approach`)
      console.log(`Last error:`, lastError)
      
      // For PO Box ZIP codes, try multiple search strategies
      if (country === 'US') {
        console.log(`Trying multiple search strategies for ZIP ${zip}`)
        
        const searchStrategies = [
          `https://nominatim.openstreetmap.org/search?q=post office ${zip} USA&format=json&limit=1`,
          `https://nominatim.openstreetmap.org/search?q=${zip} Hollywood CA USA&format=json&limit=1`,
          `https://nominatim.openstreetmap.org/search?q=${zip} Los Angeles CA USA&format=json&limit=1`,
          `https://nominatim.openstreetmap.org/search?q=Hollywood CA ${zip}&format=json&limit=1`
        ]
        
        for (let i = 0; i < searchStrategies.length; i++) {
          try {
            console.log(`Trying strategy ${i + 1} for ZIP ${zip}: ${searchStrategies[i]}`)
            const response = await fetch(searchStrategies[i], {
              headers: {
                'User-Agent': 'LootAura/1.0 (contact@lootaura.com)'
              }
            })
            
            if (response.ok) {
              const responseData = await response.json()
              if (responseData && responseData.length > 0) {
                console.log(`Found result with strategy ${i + 1} for ZIP ${zip}:`, responseData[0])
                data = responseData
                break
              }
            }
          } catch (error) {
            console.log(`Strategy ${i + 1} failed for ZIP ${zip}:`, error)
          }
        }
      }
      
      if (!data || data.length === 0) {
        // Final fallback: if it's a 90078-90087 ZIP code, use Hollywood location
        if (country === 'US' && /^9007[8-9]$/.test(zip)) {
          console.log(`Using final fallback for PO Box ZIP ${zip}`)
          const fallbackLocation = { lat: 34.1022, lng: -118.3267, city: 'Hollywood', state: 'CA' }
          
          const geocodeResult: GeocodeResult = {
            lat: fallbackLocation.lat,
            lng: fallbackLocation.lng,
            zip,
            city: fallbackLocation.city,
            state: fallbackLocation.state,
            country: 'US'
          }
          
          // Cache the result
          setCachedResult(zip, geocodeResult)
          
          return NextResponse.json(geocodeResult)
        }
        
        return NextResponse.json({ 
          error: `ZIP code ${zip} not found. This might be a PO Box-only ZIP code or a new/non-standard ZIP code.` 
        }, { status: 404 })
      }
    }
    
    const result = data[0]
    console.log(`Using result for ZIP ${zip}:`, result)
    
    // Additional validation for US results
    if (country === 'US') {
      const isUSResult = result.address?.country_code === 'us' || 
                       result.address?.country === 'United States' ||
                       result.display_name?.includes('United States') ||
                       result.address?.state_code?.length === 2 || // US state codes are 2 letters
                       result.address?.state?.length > 0 // Has a state field
      
      if (!isUSResult) {
        console.log(`Result is not from US, rejecting:`, result.address)
        return NextResponse.json({ 
          error: `ZIP code ${zip} not found in the United States. This might be a new or non-standard ZIP code.` 
        }, { status: 404 })
      }
    }
    
    const geocodeResult: GeocodeResult = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      zip,
      city: result.address?.city || result.address?.town || result.address?.village,
      state: result.address?.state,
      country: result.address?.country_code?.toUpperCase()
    }
    
    // Cache the result
    setCachedResult(zip, geocodeResult)
    
    return NextResponse.json(geocodeResult)
    
  } catch (error) {
    console.error('ZIP geocoding error:', error)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
}
