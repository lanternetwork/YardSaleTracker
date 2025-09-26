import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress } from '@/lib/geocode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address } = body
    
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }
    
    const result = await geocodeAddress(address)
    
    if (!result) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500 }
    )
  }
}
