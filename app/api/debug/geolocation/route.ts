import { NextRequest, NextResponse } from 'next/server'
import { getInitialCenter } from '@/lib/server/geo'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    console.log('=== GEOLOCATION DEBUG ===')
    
    // Get all headers for debugging
    const headers = request.headers
    const allHeaders = Object.fromEntries(headers.entries())
    
    console.log('All request headers:', allHeaders)
    
    // Test geolocation
    const location = await getInitialCenter(headers)
    
    console.log('Final geolocation result:', location)
    
    return NextResponse.json({
      location,
      headers: allHeaders,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Geolocation debug error:', error)
    return NextResponse.json({ 
      error: 'Geolocation debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
