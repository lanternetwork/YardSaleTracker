import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { T } from '@/lib/supabase/tables'

export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url)
    
    console.log(`[SALES] Using public schema`)
    
    // Parse inputs explicitly
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
    const distanceKm = searchParams.get('distanceKm') ? parseFloat(searchParams.get('distanceKm')!) : undefined
    const dateRange = searchParams.get('dateRange') || undefined
    const categories = searchParams.get('categories')?.split(',') || undefined
    const q = searchParams.get('q') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    
    // Log parameters to server console
    console.log(`[SALES] params lat=${lat}, lng=${lng}, distKm=${distanceKm}, dateRange=${dateRange}, cats=${categories?.join(',')}, q=${q}, limit=${limit}, offset=${offset}`)

    // Validate location parameters
    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing location. Provide lat & lng.' 
      }, { status: 400 })
    }

    // Clamp distance to reasonable bounds (1-160km, default ~25 miles)
    const km = Math.max(1, Math.min(distanceKm ?? 40.2336, 160)) // 25 miles ≈ 40.2336 km
    
    // Helper: baseline query to avoid hard-fail (degraded mode)
    async function runBaseline() {
      console.log(`[SALES][BASELINE] Attempting simple query on table: ${T.sales}`)
      // Use yard_sales table in public schema
      const { data, error: baseErr } = await supabase
        .from('yard_sales')
        .select('id,title,city,state,lat,lng,start_at,end_at,tags')
        .eq('status', 'active')
        .order('start_at', { ascending: true })
        .limit(24)
      if (baseErr) {
        console.log(`[SALES][ERROR][BASELINE] code=${baseErr.code}, message=${baseErr.message}, details=${baseErr.details}, hint=${baseErr.hint}`)
        return NextResponse.json({ ok: false, error: 'Database query failed', debug: { code: baseErr.code, message: baseErr.message } }, { status: 500 })
      }
      const mapped = (data || []).map((row: any) => {
        return {
          id: row.id,
          title: row.title,
          city: row.city,
          state: row.state,
          latitude: row.lat,
          longitude: row.lng,
          starts_at: row.start_at,
          ends_at: row.end_at,
          categories: row.tags || [],
          cover_image_url: null,
        }
      })
      return NextResponse.json({ ok: true, degraded: true, count: mapped.length, data: mapped })
    }

    try {
      // Build PostGIS distance query
      console.log(`[SALES][POSTGIS] Using distance filter: ${km}km from (${lat}, ${lng})`)
      
      // Use PostGIS RPC for distance filtering
      const { data, error } = await supabase.rpc('search_sales_by_distance', {
        search_lat: lat,
        search_lng: lng,
        max_distance_km: km,
        date_filter: dateRange,
        category_filter: categories,
        text_filter: q,
        result_limit: limit,
        result_offset: offset
      })

      if (error) {
        console.log(`[SALES][ERROR][POSTGIS] ${error.message}`)
        // If PostGIS fails, return 503 with degraded message
        return NextResponse.json({ 
          ok: false, 
          error: 'Distance search temporarily unavailable' 
        }, { status: 503 })
      }

      // If no RPC function exists, fall back to baseline
      if (!data) {
        console.log(`[SALES][FALLBACK] No RPC function, using baseline query`)
        return await runBaseline()
      }

      const mappedData = (data || []).map((row: any) => {
        return {
          id: row.id,
          title: row.title,
          city: row.city,
          state: row.state,
          latitude: row.lat,
          longitude: row.lng,
          starts_at: row.start_at,
          ends_at: row.end_at,
          categories: row.tags || [],
          cover_image_url: null,
          distance_m: row.distance_m
        }
      })

      return NextResponse.json({ ok: true, degraded: false, count: mappedData.length, data: mappedData })

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
