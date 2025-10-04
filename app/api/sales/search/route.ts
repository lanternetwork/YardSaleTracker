import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with explicit public schema
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anon) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

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
    
    // Parse query parameters
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
    const distanceKmParam = searchParams.get('distanceKm') ?? searchParams.get('distance')
    const distance = distanceKmParam ? parseFloat(distanceKmParam) : 25
    const city = searchParams.get('city') || undefined
    const categories = searchParams.get('categories')?.split(',') || undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50

    console.log(`[SALES_SEARCH] params lat=${lat}, lng=${lng}, distKm=${distance}, city=${city}, cats=${categories?.join(',')}, limit=${limit}`)

    // Use the new RPC function for spatial search
    let sales: any[] = []
    let error: any = null

    if (lat && lng) {
      // Use PostGIS spatial search
      const { data: postgisData, error: postgisError } = await supabase
        .rpc('search_sales_within_distance_v2', {
          p_lat: lat,
          p_lng: lng,
          p_distance_km: distance,
          p_start_date: null,
          p_end_date: null,
          p_categories: categories || null,
          p_query: city || null,
          p_limit: limit,
          p_offset: 0
        })

      if (postgisError) {
        console.log(`[SALES_SEARCH] PostGIS failed: ${postgisError.message}, falling back to bbox`)
        
        // Fallback to bbox search
        const { data: bboxData, error: bboxError } = await supabase
          .rpc('search_sales_bbox_v2', {
            p_lat: lat,
            p_lng: lng,
            p_distance_km: distance,
            p_start_date: null,
            p_end_date: null,
            p_categories: categories || null,
            p_query: city || null,
            p_limit: limit,
            p_offset: 0
          })

        if (bboxError) {
          error = bboxError
        } else {
          sales = bboxData || []
        }
      } else {
        sales = postgisData || []
      }
    } else {
      // No location provided, use basic query on sales_v2
      const { data: basicData, error: basicError } = await supabase
        .from('sales_v2')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (basicError) {
        error = basicError
      } else {
        sales = basicData || []
      }
    }

    if (error) {
      console.error('Sales search error:', error)
      return NextResponse.json({ error: 'Failed to search sales', detail: error.message }, { status: 500 })
    }

    return NextResponse.json({ sales: sales || [] })
  } catch (error: any) {
    console.error('Sales search error:', error)
    return NextResponse.json({ error: 'Failed to search sales', detail: error.message }, { status: 500 })
  }
}
