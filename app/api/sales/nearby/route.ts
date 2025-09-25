import { NextRequest } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { haversineKm } from '@/lib/distance'

const ALLOWED_RADII = [5, 10, 25, 50, 100]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') || '')
  const lng = parseFloat(searchParams.get('lng') || '')
  const radiusMilesRaw = parseFloat(searchParams.get('radius_miles') || '')
  const limitRaw = parseInt(searchParams.get('limit') || '200', 10)

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return new Response(JSON.stringify({ error: 'lat and lng are required' }), { status: 400 })
  }

  const radiusMiles = ALLOWED_RADII.includes(radiusMilesRaw as any) ? radiusMilesRaw : 25
  const limit = Math.min(Math.max(limitRaw, 1), 200)

  const supabase = createSupabaseServer()

  // Try PostGIS path first by checking for geom column existence
  // Fallback to bounding box + haversine in JS
  try {
    const { data: hasGeom } = await supabase
      .rpc('has_column', { p_schema: 'public', p_table: 'sales', p_column: 'geom' })
    const usePostgis = hasGeom === true

    if (usePostgis) {
      const radiusMeters = radiusMiles * 1609.34
      const { data, error } = await supabase
        .rpc('sales_nearby', { p_lat: lat, p_lng: lng, p_radius_m: radiusMeters, p_limit: limit })
      if (error) throw error
      return new Response(
        JSON.stringify({ items: data || [], meta: { radius_miles: radiusMiles, count: (data || []).length, fetched_at: new Date().toISOString() } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } catch {
    // ignore and fallback
  }

  // Fallback path: fetch recent sales and filter by distance
  const { data, error } = await supabase
    .from('sales')
    .select('id, source, source_id, title, url, price, location_text, lat, lng, posted_at, first_seen_at, last_seen_at, starts_at, ends_at, status')
    .order('last_seen_at', { ascending: false })
    .limit(1000)
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const center = { lat, lng }
  const withDistance = (data || [])
    .filter(row => row.lat != null && row.lng != null)
    .map(row => ({
      ...row,
      distance_km: haversineKm({ lat: center.lat, lng: center.lng }, { lat: row.lat as number, lng: row.lng as number })
    }))

  const within = withDistance.filter(r => r.distance_km <= radiusMiles * 1.60934)
  within.sort((a, b) => a.distance_km - b.distance_km || new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime())

  const items = within.slice(0, limit)
  return new Response(
    JSON.stringify({ items, meta: { radius_miles: radiusMiles, count: items.length, fetched_at: new Date().toISOString() } }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}


