import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDateWindow, saleOverlapsWindow, formatDateWindow } from '@/lib/date/dateWindows'
import { haversineKm } from '@/lib/distance'
import * as Sentry from '@sentry/nextjs'

// CRITICAL: This API MUST require lat/lng - never remove this validation
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  const { searchParams } = new URL(request.url)
  
  try {
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
    
    // 2. Parse optional filters
    const distanceKm = Math.min(parseFloat(searchParams.get('distance') || '40'), 100)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const dateRange = searchParams.get('dateRange') || 'any'
    
    console.log(`[SALES] Query params: lat=${latitude}, lng=${longitude}, distance=${distanceKm}km, limit=${limit}, categories=[${categories.join(',')}], dateRange=${dateRange}`)
    
    // 3. Get date window if needed
    const dateWindow = getDateWindow(dateRange)
    console.log(`[SALES] Date window: ${formatDateWindow(dateWindow)}`)
    
    // 4. Query sales table directly
    console.log(`[SALES] Querying sales table directly...`)
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .eq('status', 'published')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
    
    if (salesError) {
      console.error(`[SALES] Database error:`, salesError)
      throw new Error(`Database query failed: ${salesError.message}`)
    }
    
    console.log(`[SALES] Found ${salesData?.length || 0} total sales`)
    
    // 5. Filter by distance and other criteria
    let filtered = (salesData || [])
      .map((sale: any) => {
        const distance = haversineKm(latitude, longitude, sale.lat, sale.lng)
        return {
          ...sale,
          distance_m: Math.round(distance * 1000)
        }
      })
      .filter((sale: any) => {
        // Distance filter
        if (sale.distance_m > distanceKm * 1000) return false
        
        // Date filter
        if (dateWindow) {
          const startAt = sale.date_start ? `${sale.date_start}T${sale.time_start ?? '00:00:00'}` : undefined
          const endAt = sale.date_end ? `${sale.date_end}T${sale.time_end ?? '23:59:59'}` : null
          if (!startAt) return true
          if (!saleOverlapsWindow(startAt, endAt, dateWindow)) return false
        }
        
        // Category filter
        if (categories.length > 0 && sale.tags) {
          const hasMatchingCategory = categories.some(cat => 
            sale.tags.some((tag: string) => tag.toLowerCase().includes(cat.toLowerCase()))
          )
          if (!hasMatchingCategory) return false
        }
        
        return true
      })
      .sort((a: any, b: any) => a.distance_m - b.distance_m)
      .slice(0, limit)
    
    console.log(`[SALES] Filtered to ${filtered.length} sales within ${distanceKm}km`)
    
    // 6. Format response
    const response = {
      ok: true,
      data: filtered.map((sale: any) => ({
        id: sale.id,
        title: sale.title,
        starts_at: sale.date_start ? `${sale.date_start}T${sale.time_start ?? '00:00:00'}` : null,
        ends_at: sale.date_end ? `${sale.date_end}T${sale.time_end ?? '23:59:59'}` : null,
        latitude: sale.lat,
        longitude: sale.lng,
        city: sale.city,
        state: sale.state,
        zip: sale.zip_code,
        categories: sale.tags || [],
        cover_image_url: null,
        distance_m: sale.distance_m
      })),
      center: {
        lat: latitude,
        lng: longitude
      },
      distanceKm,
      count: filtered.length,
      durationMs: Date.now() - startedAt
    }
    
    console.log(`[SALES] Returning ${response.count} sales in ${response.durationMs}ms`)
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[SALES] Error:', error)
    Sentry.captureException(error)
    
    return NextResponse.json({
      ok: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}