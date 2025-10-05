import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// CRITICAL: This API MUST require lat/lng - never remove this validation
// See docs/AI_ASSISTANT_RULES.md for full guidelines
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  
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
      searchParams.get('distanceKm') ? parseFloat(searchParams.get('distanceKm')!) : 40,
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
    
    // Convert date range to start/end dates
    let startDateParam: string | null = null
    let endDateParam: string | null = null
    
    if (dateRange !== 'any') {
      if (startDate && endDate) {
        startDateParam = startDate
        endDateParam = endDate
      } else {
        // Handle predefined date ranges
        const now = new Date()
        switch (dateRange) {
          case 'today':
            startDateParam = now.toISOString().split('T')[0]
            endDateParam = now.toISOString().split('T')[0]
            break
          case 'weekend':
            const saturday = new Date(now)
            saturday.setDate(now.getDate() + (6 - now.getDay()))
            const sunday = new Date(saturday)
            sunday.setDate(saturday.getDate() + 1)
            startDateParam = saturday.toISOString().split('T')[0]
            endDateParam = sunday.toISOString().split('T')[0]
            break
          case 'next_weekend':
            const nextSaturday = new Date(now)
            nextSaturday.setDate(now.getDate() + (6 - now.getDay()) + 7)
            const nextSunday = new Date(nextSaturday)
            nextSunday.setDate(nextSaturday.getDate() + 1)
            startDateParam = nextSaturday.toISOString().split('T')[0]
            endDateParam = nextSunday.toISOString().split('T')[0]
            break
        }
      }
    }
    
    console.log(`[SALES] Query params: lat=${latitude}, lng=${longitude}, km=${distanceKm}, start=${startDateParam}, end=${endDateParam}, categories=[${categories.join(',')}], q=${q}, limit=${limit}, offset=${offset}`)
    
    let results: any[] = []
    let degraded = false
    
    // 3. Try PostGIS spatial search first
    try {
      console.log(`[SALES] Attempting PostGIS spatial search...`)
      
      const { data: postgisData, error: postgisError } = await supabase
        .rpc('search_sales_within_distance_v2', {
          p_lat: latitude,
          p_lng: longitude,
          p_distance_km: distanceKm,
          p_start_date: startDateParam,
          p_end_date: endDateParam,
          p_categories: categories.length > 0 ? categories : null,
          p_query: q || null,
          p_limit: limit,
          p_offset: offset
        })
      
      console.log(`[SALES] PostGIS RPC response:`, { data: postgisData, error: postgisError })
      
      if (postgisError) {
        console.log(`[SALES] PostGIS error details:`, postgisError)
        throw new Error(`PostGIS RPC failed: ${postgisError.message}`)
      }
      
      console.log(`[SALES] PostGIS returned ${postgisData?.length || 0} results`)
      
      results = (postgisData || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        starts_at: row.starts_at,
        ends_at: row.date_end ? `${row.date_end}T${row.time_end || '23:59:59'}` : null,
        latitude: row.lat,
        longitude: row.lng,
        city: row.city,
        state: row.state,
        zip: row.zip_code,
        categories: [], // TODO: Add categories support
        cover_image_url: null,
        distance_m: row.distance_m
      }))
        
      console.log(`[SALES] PostGIS success: ${results.length} results`)
      
    } catch (postgisError: any) {
      console.log(`[SALES] PostGIS failed: ${postgisError.message}, falling back to bbox search`)
      degraded = true
      
      // Fallback to bbox search
      try {
        console.log(`[SALES] Attempting bbox search...`)
        
        const { data: bboxData, error: bboxError } = await supabase
          .rpc('search_sales_bbox_v2', {
            p_lat: latitude,
            p_lng: longitude,
            p_distance_km: distanceKm,
            p_start_date: startDateParam,
            p_end_date: endDateParam,
            p_categories: categories.length > 0 ? categories : null,
            p_query: q || null,
            p_limit: limit,
            p_offset: offset
          })
        
        console.log(`[SALES] Bbox RPC response:`, { data: bboxData, error: bboxError })
        
        if (bboxError) {
          console.log(`[SALES] Bbox error details:`, bboxError)
          throw new Error(`Bbox RPC failed: ${bboxError.message}`)
        }
        
        console.log(`[SALES] Bbox returned ${bboxData?.length || 0} results`)
        
        results = (bboxData || []).map((row: any) => ({
          id: row.id,
          title: row.title,
          starts_at: row.starts_at,
          ends_at: row.date_end ? `${row.date_end}T${row.time_end || '23:59:59'}` : null,
          latitude: row.lat,
          longitude: row.lng,
          city: row.city,
          state: row.state,
          zip: row.zip_code,
          categories: [], // TODO: Add categories support
          cover_image_url: null,
          distance_m: row.distance_m
        }))
        
        console.log(`[SALES] Bbox success: ${results.length} results`)
        
      } catch (bboxError: any) {
        console.log(`[SALES] Both PostGIS and bbox failed: ${bboxError.message}`)
        return NextResponse.json({ 
          ok: false, 
          error: 'Database query failed' 
        }, { status: 500 })
      }
    }
    
    // 4. Return normalized response
    const response = {
      ok: true,
      data: results,
      center: { lat: latitude, lng: longitude },
      distanceKm,
      count: results.length,
      ...(degraded && { degraded: true }),
      durationMs: Date.now() - startedAt
    }
    
    console.log(`[SALES] Final result: ${results.length} sales, degraded=${degraded}, duration=${Date.now() - startedAt}ms`)
    
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
    
    const { title, description, address, city, state, zip_code, lat, lng, date_start, time_start, date_end, time_end, tags, contact } = body
    
    const { data, error } = await supabase
      .from('sales_v2')
      .insert({
        title,
        description,
        address,
        city,
        state,
        zip_code,
        lat,
        lng,
        date_start,
        time_start,
        date_end,
        time_end,
        status: 'published',
        owner_id: (await supabase.auth.getUser()).data.user?.id
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