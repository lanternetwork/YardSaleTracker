import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    
    // Get all sales from database
    const { data: sales, error } = await supabase
      .from('yard_sales')
      .select('id, title, lat, lng, address, city, state, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching sales:', error)
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
    }

    // Calculate distances between Oakland and SF if both exist
    const oakland = sales?.find(s => s.title?.includes('Oakland') || s.address?.includes('Oakland'))
    const sf = sales?.find(s => s.title?.includes('San Francisco') || s.title?.includes('Neighborhood'))
    
    let distance = null
    if (oakland && sf && oakland.lat && oakland.lng && sf.lat && sf.lng) {
      // Calculate distance in degrees
      distance = Math.sqrt(
        Math.pow(oakland.lat - sf.lat, 2) + 
        Math.pow(oakland.lng - sf.lng, 2)
      )
    }

    return NextResponse.json({
      success: true,
      totalSales: sales?.length || 0,
      sales: sales?.map(s => ({
        id: s.id,
        title: s.title,
        lat: s.lat,
        lng: s.lng,
        address: s.address,
        city: s.city,
        state: s.state,
        created_at: s.created_at
      })) || [],
      distance: distance,
      clustering: {
        oakland: oakland ? { title: oakland.title, lat: oakland.lat, lng: oakland.lng } : null,
        sf: sf ? { title: sf.title, lat: sf.lat, lng: sf.lng } : null,
        shouldCluster: distance ? distance < 0.15 : false
      }
    })

  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
