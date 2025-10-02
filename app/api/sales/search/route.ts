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

    // Build query using yard_sales table
    let query = supabase
      .from('yard_sales')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply location filter
    if (lat && lng && distance) {
      const latRange = distance / 111 // 1 degree ≈ 111 km
      const lngRange = distance / (111 * Math.cos(lat * Math.PI / 180)) // Adjust for latitude
      query = query
        .gte('lat', lat - latRange)
        .lte('lat', lat + latRange)
        .gte('lng', lng - lngRange)
        .lte('lng', lng + lngRange)
    }

    // Apply city filter
    if (city) {
      query = query.ilike('city', `%${city}%`)
    }

    // Apply category filter
    if (categories && categories.length > 0) {
      query = query.overlaps('tags', categories)
    }

    const { data: sales, error } = await query

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
