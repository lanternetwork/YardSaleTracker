import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDateWindow, saleOverlapsWindow, formatDateWindow } from '@/lib/date/dateWindows'
import { haversineKm } from '@/lib/distance'
import { getSchema } from '@/lib/supabase/schema'
import * as Sentry from '@sentry/nextjs'

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
  const startedAt = Date.now()
  const { searchParams } = new URL(request.url)
  
  try {
    logBootOnce()
    const supabase = createSupabaseServerClient()
    
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
    
    const limitRaw = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 24
    const limit = Math.min(Math.max(limitRaw, 1), 48)
    const offset = Math.max(searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0, 0)
    const cursor = searchParams.get('cursor')
    
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
    const startedAt = Date.now()

    // 4. Try PostGIS distance calculation using public wrapper
    try {
      console.log(`[SALES] Attempting PostGIS (public wrapper) for lat=${latitude}, lng=${longitude}, km=${distanceKm}`)

      // Use public wrapper function that delegates to lootaura_v2
      const fetchLimit = limit + 50
      const { data: postgisData, error: postgisError } = await supabase
        .rpc('search_sales_within_distance', {
          user_lat: latitude,
          user_lng: longitude,
          distance_meters: Math.round(distanceKm * 1000),
          search_city: null,
          search_categories: categories.length > 0 ? categories : null,
          date_start_filter: dateWindow ? dateWindow.start.toISOString().slice(0, 10) : null,
          date_end_filter: dateWindow ? dateWindow.end.toISOString().slice(0, 10) : null,
          limit_count: fetchLimit
        })

      if (postgisError) {
        throw new Error(`PostGIS v2 RPC failed: ${postgisError.message}`)
      }

      console.log(`[SALES] PostGIS public wrapper returned ${postgisData?.length || 0} results`)

      // Map v2 fields to the legacy response shape
      let mapped = (postgisData || [])
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

      // Stable ordering for cursor (distance, starts_at, id)
      mapped.sort((a: { distance_m?: number; starts_at?: string | null; id: string }, b: { distance_m?: number; starts_at?: string | null; id: string }) => {
        const ad = a.distance_m ?? 0, bd = b.distance_m ?? 0
        if (ad !== bd) return ad - bd
        const as = a.starts_at || '', bs = b.starts_at || ''
        if (as !== bs) return as < bs ? -1 : 1
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
      })

      // Apply cursor if provided
      if (cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString()) as { d: number; s: string; id: string }
          mapped = mapped.filter((r: any) => {
            const cmp = (r.distance_m ?? 0) - decoded.d
            if (cmp > 0) return true
            if (cmp < 0) return false
            if ((r.starts_at || '') > decoded.s) return true
            if ((r.starts_at || '') < decoded.s) return false
            return r.id > decoded.id
          })
        } catch {}
      }

      results = mapped.slice(0, limit)

      console.log(`[SALES] PostGIS public wrapper success: ${results.length} results`)

    } catch (postgisError: any) {
      console.log(`[SALES] PostGIS public wrapper failed: ${postgisError.message}, falling back to bounding box (public view)`)
      degraded = true

      // Fallback to bounding box approximation using public view
      const latRange = distanceKm / 111 // 1 degree ≈ 111 km
      const lngRange = distanceKm / (111 * Math.cos(latitude * Math.PI / 180)) // Adjust for latitude

      console.log(`[SALES] Bounding box: lat=${latitude}±${latRange}, lng=${longitude}±${lngRange}`)

      // Use public view instead of schema switching
      let query = supabase
        .from('sales_v2')
        .select('id,title,city,state,zip_code,lat,lng,date_start,time_start,date_end,time_end,tags,status')
        .gte('lat', latitude - latRange)
        .lte('lat', latitude + latRange)
        .gte('lng', longitude - lngRange)
        .lte('lng', longitude + lngRange)
        .order('date_start', { ascending: true })
        .limit(limit + 50)

      // Apply category filter
      if (categories.length > 0) {
        query = query.overlaps('tags', categories)
      }

      // Apply text filter (approximate)
      if (q) {
        query = query.or(`title.ilike.%${q}%,city.ilike.%${q}%`)
      }

      let { data: bboxData, error: bboxError } = await query
      console.log(`[SALES][DEBUG] Database query result:`, {
        hasData: !!bboxData,
        dataLength: bboxData?.length || 0,
        firstRow: bboxData?.[0],
        error: bboxError?.message,
        query: `lat=${latitude}±${latRange}, lng=${longitude}±${lngRange}`
      })
      
      // Additional debugging: check if sales_v2 view exists and has data
      if (!bboxError && (bboxData?.length ?? 0) === 0) {
        console.log(`[SALES][DEBUG] No results found, checking sales_v2 view directly...`)
        const { data: directData, error: directError } = await supabase
          .from('sales_v2')
          .select('id, title, city, state, lat, lng, status')
          .limit(5)
        console.log(`[SALES][DEBUG] Direct sales_v2 query:`, {
          hasData: !!directData,
          dataLength: directData?.length || 0,
          sample: directData?.[0],
          error: directError?.message
        })
      }
      if (bboxError && (bboxError as any).code === '42501') {
        console.log('[SALES][ERROR][BOUNDING_BOX] RLS denied; attempting anon-friendly public view if available')
      }

      if (bboxError) {
        console.log(`[SALES][ERROR][BOUNDING_BOX] ${bboxError.message}`)
        const detail = process.env.VERCEL_ENV === 'development' || process.env.VERCEL_ENV === 'preview' ? bboxError.message : undefined
        return NextResponse.json({ 
          ok: false, 
          error: 'Database query failed',
          ...(detail ? { detail } : {})
        }, { status: 500 })
      }

      // If zero results and we previously filtered by status on the server in legacy code, try a relaxed retry without status
      if (!bboxError && (bboxData?.length ?? 0) === 0) {
        console.log('[SALES][bbox] No rows on first attempt; retrying without status constraints')
        const retry = await supabase
          .from('sales_v2')
          .select('id,title,city,state,zip_code,lat,lng,date_start,time_start,date_end,time_end,tags,status')
          .gte('lat', latitude - latRange)
          .lte('lat', latitude + latRange)
          .gte('lng', longitude - lngRange)
          .lte('lng', longitude + lngRange)
          .order('date_start', { ascending: true })
          .limit(limit + 50)
        if (!retry.error) {
          bboxData = retry.data
        }
      }

      // Apply date filtering in application layer for bounding box results
      let mapped = (bboxData || [])
        .filter((row: any) => {
          if (!dateWindow) return true
          const startAt = row.date_start ? `${row.date_start}T${row.time_start ?? '00:00:00'}` : undefined
          const endAt = row.date_end ? `${row.date_end}T${row.time_end ?? '23:59:59'}` : null
          if (!startAt) return true
          return saleOverlapsWindow(startAt, endAt, dateWindow)
        })
        .map((row: any) => {
          const starts_at = row.date_start ? `${row.date_start}T${row.time_start ?? '00:00:00'}` : null
          const ends_at = row.date_end ? `${row.date_end}T${row.time_end ?? '23:59:59'}` : null
          const distKm = haversineKm({ lat: latitude, lng: longitude }, { lat: row.lat, lng: row.lng })
          return {
            id: row.id,
            title: row.title,
            starts_at,
            ends_at,
            lat: row.lat,
            lng: row.lng,
            city: row.city,
            state: row.state,
            zip: row.zip_code,
            categories: row.tags || [],
            cover_image_url: null,
            distance_m: Math.round((distKm ?? 0) * 1000)
          }
        })

      // Stable order and cursor application
      mapped.sort((a: { distance_m?: number; starts_at?: string | null; id: string }, b: { distance_m?: number; starts_at?: string | null; id: string }) => {
        const ad = a.distance_m ?? 0, bd = b.distance_m ?? 0
        if (ad !== bd) return ad - bd
        const as = a.starts_at || '', bs = b.starts_at || ''
        if (as !== bs) return as < bs ? -1 : 1
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
      })
      if (cursor) {
        try {
          const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString()) as { d: number; s: string; id: string }
      mapped = mapped.filter((r: any) => {
            const cmp = (r.distance_m ?? 0) - decoded.d
            if (cmp > 0) return true
            if (cmp < 0) return false
            if ((r.starts_at || '') > decoded.s) return true
            if ((r.starts_at || '') < decoded.s) return false
            return r.id > decoded.id
          })
        } catch {}
      }

      results = mapped.slice(0, limit)
    }
    
    // 5. Return normalized response
    const durationMs = Date.now() - startedAt
    // Compute nextCursor if more may exist
    let nextCursor: string | undefined = undefined
    if (results.length === limit) {
      const last = results[results.length - 1]
      try {
        nextCursor = Buffer.from(JSON.stringify({ d: last.distance_m ?? 0, s: last.starts_at || '', id: last.id })).toString('base64')
      } catch {}
    }

    const response = {
      ok: true,
      data: results,
      center: { lat: latitude, lng: longitude },
      distanceKm,
      count: results.length,
      nextCursor,
      durationMs,
      ...(degraded && { degraded: true }),
      ...(dateWindow && { dateWindow: {
        label: dateWindow.label,
        start: dateWindow.start.toISOString(),
        end: dateWindow.end.toISOString(),
        display: formatDateWindow(dateWindow)
      }})
    }
    
    console.log(`[SALES][ok] lat=${latitude}, lng=${longitude}, km=${distanceKm}, filters=date:${dateRange}|cats:${categories.join(',')}|q:${q ?? ''}, degraded=${degraded}, count=${results.length}, ms=${durationMs}`)
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.log(`[SALES][err] Unexpected error: ${error?.message || error}`)
    
    // Capture error to Sentry with context
    Sentry.captureException(error, {
      tags: {
        api: 'sales',
        method: 'GET'
      },
      extra: {
        lat: searchParams.get('lat'),
        lng: searchParams.get('lng'),
        distanceKm: searchParams.get('distanceKm'),
        dateRange: searchParams.get('dateRange'),
        categories: searchParams.get('categories'),
        q: searchParams.get('q'),
        limit: searchParams.get('limit')
      }
    })
    
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