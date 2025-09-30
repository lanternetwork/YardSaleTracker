import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer, getTableName } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '25'
    const status = searchParams.get('status') || 'published'
    
    // Use schema-qualified table name
    const salesTable = getTableName('sales')
    
    let query = supabase
      .from(salesTable)
      .select('*')
      .eq('status', status)
    
    // Add location filtering if coordinates provided
    if (lat && lng) {
      const radiusKm = parseFloat(radius)
      // Note: This is a simplified distance filter
      // In production, you'd want to use PostGIS or a more sophisticated approach
      query = query
        .gte('lat', parseFloat(lat) - (radiusKm / 111)) // Rough conversion: 1 degree ≈ 111 km
        .lte('lat', parseFloat(lat) + (radiusKm / 111))
        .gte('lng', parseFloat(lng) - (radiusKm / 111))
        .lte('lng', parseFloat(lng) + (radiusKm / 111))
    }
    
    const { data: sales, error } = await query
    
    if (error) {
      console.error('Error fetching sales:', error)
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
    }
    
    return NextResponse.json({ sales })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const body = await request.json()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Use schema-qualified table name
    const salesTable = getTableName('sales')
    
    const { data: sale, error } = await supabase
      .from(salesTable)
      .insert({
        owner_id: user.id,
        title: body.title,
        description: body.description,
        address: body.address,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        lat: body.lat,
        lng: body.lng,
        date_start: body.date_start,
        time_start: body.time_start,
        date_end: body.date_end,
        time_end: body.time_end,
        status: body.status || 'draft',
        privacy_mode: body.privacy_mode || 'exact'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating sale:', error)
      return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
    }
    
    return NextResponse.json({ sale })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
