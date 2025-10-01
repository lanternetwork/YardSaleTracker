import { NextRequest, NextResponse } from 'next/server'
import { getSales } from '@/lib/data/sales'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
    // Accept distanceKm (canonical) and fallback to distance
    const distanceKmParam = searchParams.get('distanceKm') ?? searchParams.get('distance')
    const distance = distanceKmParam ? parseFloat(distanceKmParam) : 25
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
      limit,
      offset: 0
    })

    return NextResponse.json({ sales })
  } catch (error) {
    console.error('Sales search error (primary path):', error)
    // Fallback: try a simple direct query without RPC or filters
    try {
      const supabase = createSupabaseServerClient()
      const { data, error: dbError } = await supabase
        .from(T.sales)
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(50)
      if (dbError) {
        console.error('Sales search error (fallback query):', dbError)
        return NextResponse.json({ error: 'Failed to search sales', detail: dbError.message }, { status: 500 })
      }
      return NextResponse.json({ sales: data || [] })
    } catch (fallbackErr: any) {
      console.error('Sales search error (fallback path):', fallbackErr)
      return NextResponse.json({ error: 'Failed to search sales', detail: String(fallbackErr?.message || fallbackErr) }, { status: 500 })
    }
  }
}
