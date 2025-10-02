import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check sales count
    const { count: salesCount } = await supabase
      .from('yard_sales')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    // Check ZIP codes count
    const { count: zipCount } = await supabase
      .from('lootaura_v2.zipcodes')
      .select('*', { count: 'exact', head: true })
    
    // Get a few sample sales
    const { data: sampleSales } = await supabase
      .from('yard_sales')
      .select('id, title, city, state, lat, lng')
      .eq('status', 'active')
      .limit(5)
    
    // Get a few sample ZIP codes
    const { data: sampleZips } = await supabase
      .from('lootaura_v2.zipcodes')
      .select('zip, city, state, lat, lng')
      .limit(5)
    
    return NextResponse.json({
      ok: true,
      sales: {
        count: salesCount || 0,
        samples: sampleSales || []
      },
      zipcodes: {
        count: zipCount || 0,
        samples: sampleZips || []
      }
    })
    
  } catch (error: any) {
    console.error('Database debug error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error.message 
    }, { status: 500 })
  }
}
