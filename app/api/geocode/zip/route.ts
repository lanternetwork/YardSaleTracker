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

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute

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
    
    // Geocode using Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=${country}&format=json&limit=1`
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'LootAura/1.0 (contact@lootaura.com)'
      }
    })
    
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
    
    return NextResponse.json(geocodeResult)
    
  } catch (error) {
    console.error('ZIP geocoding error:', error)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
}
