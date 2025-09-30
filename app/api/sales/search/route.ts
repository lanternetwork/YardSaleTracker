import { NextRequest, NextResponse } from 'next/server'
import { getSales } from '@/lib/data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
    const distance = searchParams.get('distance') ? parseFloat(searchParams.get('distance')!) : 25
    const city = searchParams.get('city') || undefined
    const categories = searchParams.get('categories')?.split(',') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    // Validate required parameters for location-based search
    if (lat && lng && !distance) {
      return NextResponse.json({ error: 'Distance is required for location-based search' }, { status: 400 })
    }

    const sales = await getSales({
      lat,
      lng,
      distanceKm: distance,
      city,
      categories,
      limit
    })

    return NextResponse.json(sales)
  } catch (error) {
    console.error('Sales search error:', error)
    return NextResponse.json(
      { error: 'Failed to search sales' }, 
      { status: 500 }
    )
  }
}
