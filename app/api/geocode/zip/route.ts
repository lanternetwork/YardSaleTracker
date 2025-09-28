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
    
    // Validate US ZIP format
    if (country === 'US' && !/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: 'Invalid US ZIP code format' }, { status: 400 })
    }
    
    // Check cache first
    const cached = getCachedResult(zip)
    if (cached) {
      console.log(`Cache hit for ZIP ${zip}`)
      return NextResponse.json(cached)
    }
    
    console.log(`Cache miss for ZIP ${zip}, fetching from Nominatim`)
    
    // Geocode using Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=${country}&format=json&limit=1`
    
    const startTime = Date.now()
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'LootAura/1.0 (contact@lootaura.com)'
      }
    })
    
    const fetchTime = Date.now() - startTime
    console.log(`Nominatim request took ${fetchTime}ms`)
    
    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'ZIP code not found' }, { status: 404 })
    }
    
    const result = data[0]
    
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
