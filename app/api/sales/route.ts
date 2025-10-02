import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDateWindow, saleOverlapsWindow, formatDateWindow } from '@/lib/date/dateWindows'
import { getSchema } from '@/lib/supabase/schema'

// CRITICAL: This API MUST require lat/lng - never remove this validation
// See docs/AI_ASSISTANT_RULES.md for full guidelines
export const dynamic = 'force-dynamic'

// One-time boot log to confirm v2 usage
let __salesBootLogged = false
function logBootOnce(): void {
  if (!__salesBootLogged) {
    const resolvedSchema = getSchema()
    console.log(`[SALES][BOOT] schema=${resolvedSchema} table=lootaura_v2.sales`)
    __salesBootLogged = true
  }
}

export async function GET(request: NextRequest) {
  try {
    logBootOnce()
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

    // 4. Try PostGIS distance calculation first against lootaura_v2.sales
    try {
      console.log(`[SALES] Attempting PostGIS (v2) for lat=${latitude}, lng=${longitude}, km=${distanceKm}`)

      // Prefer v2 search function that uses geom + RLS
      const { data: postgisData, error: postgisError } = await supabase
        .rpc('search_sales_within_distance', {
          user_lat: latitude,
          user_lng: longitude,
          distance_meters: Math.round(distanceKm * 1000),
          search_city: null,
          search_categories: categories.length > 0 ? categories : null,
          date_start_filter: dateWindow ? dateWindow.start.toISOString().slice(0, 10) : null,
          date_end_filter: dateWindow ? dateWindow.end.toISOString().slice(0, 10) : null,
          limit_count: limit
        })

      if (postgisError) {
        throw new Error(`PostGIS v2 RPC failed: ${postgisError.message}`)
      }

      console.log(`[SALES] PostGIS v2 returned ${postgisData?.length || 0} results`)

      // Map v2 fields to the legacy response shape
      results = (postgisData || [])
        .filter((row: any) => {
          if (!dateWindow) return true
          const startAt = row.date_start ? `${row.date_start}T${row.time_start ?? '00:00:00'}` : undefined
          const endAt = row.date_end ? `${row.date_end}T${row.time_end ?? '23:59:59'}` : null
          if (!startAt) return true
          return saleOverlapsWindow(startAt, endAt, dateWindow)
        })
        .map((row: any) => {
          const startAt = row.date_start ? `${row.date_start}T${row.time_start ?? '00:00:00'}` : null
          const endAt = row.date_end ? `${row.date_end}T${row.time_end ?? '23:59:59'}` : null
          return {
            id: row.id,
            title: row.title,
            starts_at: startAt,
            ends_at: endAt,
            latitude: row.lat,
            longitude: row.lng,
            city: row.city,
            state: row.state,
            zip: row.zip_code,
            categories: row.tags || [],
            cover_image_url: null,
            distance_m: row.distance_meters ?? row.distance_m
          }
        })

      console.log(`[SALES] PostGIS v2 success: ${results.length} results`)

    } catch (postgisError: any) {
      console.log(`[SALES] PostGIS v2 failed: ${postgisError.message}, falling back to bounding box (v2)`)
      degraded = true

      // Fallback to bounding box approximation against lootaura_v2.sales
      const latRange = distanceKm / 111 // 1 degree ≈ 111 km
      const lngRange = distanceKm / (111 * Math.cos(latitude * Math.PI / 180)) // Adjust for latitude

      console.log(`[SALES] Bounding box: lat=${latitude}±${latRange}, lng=${longitude}±${lngRange}`)

      let query = supabase
        .from('lootaura_v2.sales')
        .select('id,title,city,state,zip_code,lat,lng,date_start,time_start,date_end,time_end,tags,status')
        .eq('status', 'published')
        .gte('lat', latitude - latRange)
        .lte('lat', latitude + latRange)
        .gte('lng', longitude - lngRange)
        .lte('lng', longitude + lngRange)
        .order('date_start', { ascending: true })
        .limit(limit)
        .range(offset, offset + limit - 1)

      // Apply category filter
      if (categories.length > 0) {
        query = query.overlaps('tags', categories)
      }

      // Apply text filter (approximate)
      if (q) {
        query = query.or(`title.ilike.%${q}%,city.ilike.%${q}%`)
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
          const startAt = row.date_start ? `${row.date_start}T${row.time_start ?? '00:00:00'}` : undefined
          const endAt = row.date_end ? `${row.date_end}T${row.time_end ?? '23:59:59'}` : null
          if (!startAt) return true
          return saleOverlapsWindow(startAt, endAt, dateWindow)
        })
        .map((row: any) => ({
          id: row.id,
          title: row.title,
          starts_at: row.date_start ? `${row.date_start}T${row.time_start ?? '00:00:00'}` : null,
          ends_at: row.date_end ? `${row.date_end}T${row.time_end ?? '23:59:59'}` : null,
          latitude: row.lat,
          longitude: row.lng,
          city: row.city,
          state: row.state,
          zip: row.zip_code,
          categories: row.tags || [],
          cover_image_url: null
        }))
    }
    
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