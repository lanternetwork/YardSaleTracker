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
    let degraded = false
    
    try {
      // 4. Try PostGIS distance query first
      const { data: postgisData, error: postgisError } = await supabase.rpc('search_sales_by_distance', {
        search_lat: latitude,
        search_lng: longitude,
        max_distance_km: distanceKm,
        date_filter: dateRange !== 'any' ? dateRange : null,
        category_filter: categories.length > 0 ? categories : null,
        text_filter: q || null,
        result_limit: limit,
        result_offset: offset
      })
      
      if (!postgisError && postgisData) {
        console.log(`[SALES][POSTGIS] Success, found ${postgisData.length} results`)
        results = postgisData.map((row: any) => ({
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
          cover_image_url: null,
          distance_m: row.distance_m
        }))
      } else {
        throw new Error('PostGIS query failed')
      }
      
    } catch (postgisErr) {
      console.log(`[SALES][FALLBACK] PostGIS unavailable, using bounding box`)
      degraded = true
      
      // 5. Fallback to bounding box approximation
      const latRange = distanceKm / 111 // 1 degree ≈ 111 km
      const lngRange = distanceKm / (111 * Math.cos(latitude * Math.PI / 180)) // Adjust for latitude
      
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
    }
    
    // 6. Return normalized response
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
    // Create Supabase client with explicit public schema
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !anon) {
      return NextResponse.json({ ok: false, error: 'Missing Supabase configuration' }, { status: 500 })
    }
    
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')
    
    const supabase = createServerClient(url, anon, {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookies().set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookies().set({ name, value: '', ...options, maxAge: 0 })
        },
      },
      // Use default public schema
    })
    
    const body = await request.json()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Unauthorized' 
      }, { status: 401 })
    }
    
    console.log(`[SALES][POST] Creating sale for user ${user.id}`)
    
    const { data: sale, error } = await supabase
      .from('yard_sales')
      .insert({
        owner_id: user.id,
        title: body.title,
        description: body.description,
        address: body.address,
        city: body.city,
        state: body.state,
        zip: body.zip_code,
        lat: body.lat,
        lng: body.lng,
        start_at: body.date_start ? `${body.date_start}T${body.time_start || '08:00'}:00Z` : null,
        end_at: body.date_end ? `${body.date_end}T${body.time_end || '12:00'}:00Z` : null,
        status: body.status || 'active',
        source: 'user'
      })
      .select()
      .single()
    
    if (error) {
      console.log(`[SALES][POST][ERROR] code=${error.code}, message=${error.message}, details=${error.details}, hint=${error.hint}`)
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to create sale' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      ok: true, 
      data: sale 
    })
    
  } catch (error: any) {
    console.log(`[SALES][POST][ERROR] Unexpected error: ${error?.message || error}`)
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
