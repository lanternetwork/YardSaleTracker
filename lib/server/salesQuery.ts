import { createSupabaseServer } from '@/lib/supabase/server'
import { calculateBoundingBox, calculateDistance } from './geo'

export interface SalesQueryParams {
  lat: number
  lng: number
  radiusMi: number
  dateFrom?: string
  dateTo?: string
}

export interface Sale {
  id: string
  title: string
  description?: string
  address?: string
  city?: string
  state?: string
  lat?: number
  lng?: number
  start_at?: string
  end_at?: string
  date_start?: string
  date_end?: string
  time_start?: string
  time_end?: string
  tags?: string[]
  photos?: string[]
  contact?: string
  status?: string
  created_at?: string
  updated_at?: string
}

/**
 * Query sales within a radius of a center point
 */
export async function querySalesByRadius(params: SalesQueryParams): Promise<Sale[]> {
  const { lat, lng, radiusMi, dateFrom, dateTo } = params
  
  // Calculate bounding box for efficient database query
  const bbox = calculateBoundingBox(lat, lng, radiusMi)
  
  const supabase = createSupabaseServer()
  
  // Build the query with bounding box filter
  let query = supabase
    .from('yard_sales')
    .select('*')
    .eq('status', 'published')
    .gte('lat', bbox.latMin)
    .lte('lat', bbox.latMax)
    .gte('lng', bbox.lngMin)
    .lte('lng', bbox.lngMax)
  
  // Add date filters if provided
  if (dateFrom) {
    query = query.gte('date_start', dateFrom)
  }
  if (dateTo) {
    query = query.lte('date_end', dateTo)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error querying sales:', error)
    return []
  }
  
  if (!data) return []
  
  // Apply precise Haversine distance filter to remove corner cases
  const filteredSales = data.filter(sale => {
    if (!sale.lat || !sale.lng) return false
    
    const distance = calculateDistance(lat, lng, sale.lat, sale.lng)
    return distance <= radiusMi
  })
  
  return filteredSales
}

/**
 * Get default date range (current week)
 */
export function getDefaultDateRange(): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Start of current week (Sunday)
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  
  // End of current week (Saturday)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  return {
    dateFrom: startOfWeek.toISOString().split('T')[0],
    dateTo: endOfWeek.toISOString().split('T')[0]
  }
}
