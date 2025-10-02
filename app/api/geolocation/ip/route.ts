import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    
    // Try to get location from Vercel IP headers first
    const vercelLat = headersList.get('x-vercel-ip-latitude')
    const vercelLng = headersList.get('x-vercel-ip-longitude')
    const vercelCity = headersList.get('x-vercel-ip-city')
    const vercelCountry = headersList.get('x-vercel-ip-country')

    if (vercelLat && vercelLng) {
      return NextResponse.json({
        lat: parseFloat(vercelLat),
        lng: parseFloat(vercelLng),
        city: vercelCity,
        country: vercelCountry,
        source: 'vercel'
      })
    }

    // Fallback to external IP geolocation API
    const clientIP = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     request.ip ||
                     '127.0.0.1'

    const response = await fetch(`https://ipapi.co/${clientIP}/json/`)
    
    if (!response.ok) {
      throw new Error('IP geolocation API failed')
    }

    const data = await response.json()
    
    if (data.latitude && data.longitude) {
      return NextResponse.json({
        lat: parseFloat(data.latitude),
        lng: parseFloat(data.longitude),
        city: data.city,
        state: data.region,
        country: data.country_name,
        source: 'ipapi'
      })
    }

    // Final fallback to Louisville, KY
    return NextResponse.json({
      lat: 38.2527,
      lng: -85.7585,
      city: 'Louisville',
      state: 'KY',
      country: 'US',
      source: 'fallback'
    })

  } catch (error) {
    console.error('IP geolocation error:', error)
    
    // Return fallback location on error
    return NextResponse.json({
      lat: 38.2527,
      lng: -85.7585,
      city: 'Louisville',
      state: 'KY',
      country: 'US',
      source: 'fallback'
    })
  }
}
