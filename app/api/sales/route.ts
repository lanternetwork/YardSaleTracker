import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDateWindow, saleOverlapsWindow, formatDateWindow } from '@/lib/date/dateWindows'

// CRITICAL: This API MUST require lat/lng - never remove this validation
// See docs/AI_ASSISTANT_RULES.md for full guidelines
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    
    // 1. Parse & validate required location
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    
    if (!lat || !lng) {
      console.log(`[SALES] Missing location: lat=${lat}, lng=${lng}`)
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing location' 
      }, { status: 400 })
    }
    
    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    
    if (isNaN(latitude) || isNaN(longitude)) {
      console.log(`[SALES] Invalid location: lat=${lat}, lng=${lng}`)
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid location coordinates' 
      }, { status: 400 })
    }
    
    // 2. Parse & validate other parameters
    const distanceKm = Math.max(1, Math.min(
      searchParams.get('distanceKm') ? parseFloat(searchParams.get('distanceKm')!) : 40.2336,
      160
    ))
    
    const dateRange = searchParams.get('dateRange') || 'any'
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    
    const categoriesParam = searchParams.get('categories')
    const categories = categoriesParam 
      ? categoriesParam.split(',').map(c => c.trim()).filter(c => c.length > 0).slice(0, 10)
      : []
    
    const q = searchParams.get('q')
    if (q && q.length > 64) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Search query too long' 
      }, { status: 400 })
    }
    
    const limit = Math.min(searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50, 100)
    const offset = Math.max(searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0, 0)
    
    // Log parameters
    console.log(`[SALES] lat=${latitude},lng=${longitude},km=${distanceKm},dateRange=${dateRange},cats=${categories.join(',')},q=${q} -> returned=count degraded?=bool`)
    
    // 3. Compute date window if needed
    const dateWindow = dateRange !== 'any' ? getDateWindow(dateRange, startDate, endDate) : null
    if (dateRange !== 'any' && !dateWindow) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid date range parameters' 
      }, { status: 400 })
    }
    
    let results: any[] = []
    let degraded = true // Always use bounding box for now
    
    // 4. Use bounding box approximation (skip PostGIS for now)
    console.log(`[SALES] Using bounding box approach for lat=${latitude}, lng=${longitude}, km=${distanceKm}`)
    
    const latRange = distanceKm / 111 // 1 degree ≈ 111 km
    const lngRange = distanceKm / (111 * Math.cos(latitude * Math.PI / 180)) // Adjust for latitude
    
    console.log(`[SALES] Bounding box: lat=${latitude}±${latRange}, lng=${longitude}±${lngRange}`)
    console.log(`[SALES] Range: lat[${latitude - latRange}, ${latitude + latRange}], lng[${longitude - lngRange}, ${longitude + lngRange}]`)
    
    let query = supabase
      .from('yard_sales')
      .select('*')
      .eq('status', 'active')
      .gte('lat', latitude - latRange)
      .lte('lat', latitude + latRange)
      .gte('lng', longitude - lngRange)
      .lte('lng', longitude + lngRange)
      .order('start_at', { ascending: true })
      .limit(limit)
      .range(offset, offset + limit - 1)
    
    // Apply category filter
    if (categories.length > 0) {
      query = query.overlaps('tags', categories)
    }
    
    // Apply text filter
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%`)
    }
    
    const { data: bboxData, error: bboxError } = await query
    
    if (bboxError) {
      console.log(`[SALES][ERROR][BOUNDING_BOX] ${bboxError.message}`)
      return NextResponse.json({ 
        ok: false, 
        error: 'Database query failed' 
      }, { status: 500 })
    }
    
    // Apply date filtering in application layer for bounding box results
    results = (bboxData || [])
      .filter((row: any) => {
        if (!dateWindow) return true
        return saleOverlapsWindow(row.start_at, row.end_at, dateWindow)
      })
      .map((row: any) => ({
        id: row.id,
        title: row.title,
        starts_at: row.start_at,
        ends_at: row.end_at,
        latitude: row.lat,
        longitude: row.lng,
        city: row.city,
        state: row.state,
        zip: row.zip,
        categories: row.tags || [],
        cover_image_url: null
      }))
    
    // 5. Return normalized response
    const response = {
      ok: true,
      data: results,
      center: { lat: latitude, lng: longitude },
      distanceKm,
      count: results.length,
      ...(degraded && { degraded: true }),
      ...(dateWindow && { dateWindow: {
        label: dateWindow.label,
        start: dateWindow.start.toISOString(),
        end: dateWindow.end.toISOString(),
        display: formatDateWindow(dateWindow)
      }})
    }
    
    console.log(`[SALES] lat=${latitude},lng=${longitude},km=${distanceKm},dateRange=${dateRange},cats=${categories.join(',')},q=${q} -> returned=${results.length} degraded=${degraded}`)
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.log(`[SALES][ERROR] Unexpected error: ${error?.message || error}`)
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const body = await request.json()
    
    const { title, description, address, city, state, zip, lat, lng, start_at, end_at, tags, contact } = body
    
    const { data, error } = await supabase
      .from('yard_sales')
      .insert({
        title,
        description,
        address,
        city,
        state,
        zip,
        lat,
        lng,
        start_at,
        end_at,
        tags: tags || [],
        contact,
        status: 'active',
        source: 'manual'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Sales insert error:', error)
      return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
    }
    
    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    console.error('Sales POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}