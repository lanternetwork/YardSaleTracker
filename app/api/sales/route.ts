import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    
    // Parse inputs explicitly
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
    const distanceKm = searchParams.get('distanceKm') ? parseFloat(searchParams.get('distanceKm')!) : 25
    const dateRange = searchParams.get('dateRange') || undefined
    const categories = searchParams.get('categories')?.split(',') || undefined
    const q = searchParams.get('q') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    
    // Log parameters to server console
    console.log(`[SALES] params lat=${lat}, lng=${lng}, distKm=${distanceKm}, dateRange=${dateRange}, cats=${categories?.join(',')}, q=${q}, limit=${limit}, offset=${offset}`)
    
    // Helper: baseline query to avoid hard-fail (degraded mode)
    async function runBaseline() {
      console.log(`[SALES][BASELINE] Attempting simple query on table: ${T.sales}`)
      const { data, error: baseErr } = await supabase
        .from(T.sales)
        .select('id,title,city,state,lat,lng,date_start,time_start,date_end,time_end,tags')
        .eq('status', 'published')
        .order('date_start', { ascending: true })
        .limit(24)
      if (baseErr) {
        console.log(`[SALES][ERROR][BASELINE] code=${baseErr.code}, message=${baseErr.message}, details=${baseErr.details}, hint=${baseErr.hint}`)
        return NextResponse.json({ ok: false, error: 'Database query failed', debug: { code: baseErr.code, message: baseErr.message } }, { status: 500 })
      }
      const mapped = (data || []).map((row: any) => {
        const starts_at = `${row.date_start}T${row.time_start ?? '08:00'}:00`
        const ends_at = row.date_end ? `${row.date_end}T${row.time_end ?? '12:00'}:00` : null
        return {
          id: row.id,
          title: row.title,
          city: row.city,
          state: row.state,
          latitude: row.lat,
          longitude: row.lng,
          starts_at,
          ends_at,
          categories: row.tags || [],
          cover_image_url: null,
        }
      })
      return NextResponse.json({ ok: true, degraded: true, count: mapped.length, data: mapped })
    }

    try {
      // Build advanced query with filters
      let query = supabase
        .from(T.sales)
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1)

      // Apply filters
      if (lat && lng && distanceKm) {
        const latRange = distanceKm / 111 // 1 degree ≈ 111 km
        const lngRange = distanceKm / (111 * Math.cos(lat * Math.PI / 180)) // Adjust for latitude
        query = query
          .gte('lat', lat - latRange)
          .lte('lat', lat + latRange)
          .gte('lng', lng - lngRange)
          .lte('lng', lng + lngRange)
      }

      if (dateRange && dateRange !== 'any') {
        const today = new Date()
        const todayStr = today.toISOString().split('T')[0]

        if (dateRange === 'today') {
          query = query.eq('date_start', todayStr)
        } else if (dateRange === 'weekend') {
          const dayOfWeek = today.getDay()
          const daysUntilSaturday = (6 - dayOfWeek) % 7
          const daysUntilSunday = (7 - dayOfWeek) % 7

          const saturday = new Date(today)
          saturday.setDate(today.getDate() + daysUntilSaturday)

          const sunday = new Date(today)
          sunday.setDate(today.getDate() + daysUntilSunday)

          query = query
            .gte('date_start', saturday.toISOString().split('T')[0])
            .lte('date_start', sunday.toISOString().split('T')[0])
        }
      }

      if (categories && categories.length > 0) {
        query = query.overlaps('tags', categories)
      }

      if (q) {
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,city.ilike.%${q}%`)
      }

      const { data: sales, error } = await query
      if (error) {
        console.log(`[SALES][ERROR] code=${error.code}, message=${error.message}, details=${error.details}, hint=${error.hint}`)
        return await runBaseline()
      }

      return NextResponse.json({ ok: true, degraded: false, count: sales?.length || 0, data: sales || [] })
    } catch (advErr: any) {
      console.log(`[SALES][ERROR][ADVANCED] ${advErr?.message || advErr}`)
      return await runBaseline()
    }
    
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
      .from(T.sales)
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
