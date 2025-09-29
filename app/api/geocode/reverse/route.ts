import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface ReverseGeocodeResult {
  lat: number
  lng: number
  zip?: string
  city?: string
  state?: string
  country?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    
    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }
    
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }
    
    // Reverse geocode using Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'LootAura/1.0 (contact@lootaura.com)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (!data || !data.address) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }
    
    const result: ReverseGeocodeResult = {
      lat: latitude,
      lng: longitude,
      zip: data.address.postcode,
      city: data.address.city || data.address.town || data.address.village,
      state: data.address.state,
      country: data.address.country_code?.toUpperCase()
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 500 })
  }
}
