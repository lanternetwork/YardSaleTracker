import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Get all sales with their tags/categories
    const { data: sales, error } = await supabase
      .from('yard_sales')
      .select('id, title, tags')
      .eq('status', 'active')
      .limit(10)
    
    if (error) {
      console.error('[TEST-CATEGORIES] Database error:', error)
      return NextResponse.json({ 
        ok: false, 
        error: 'Database query failed',
        details: error.message
      }, { status: 500 })
    }
    
    // Count sales with and without categories
    const withCategories = sales?.filter(sale => sale.tags && sale.tags.length > 0) || []
    const withoutCategories = sales?.filter(sale => !sale.tags || sale.tags.length === 0) || []
    
    // Get unique categories
    const allCategories = new Set<string>()
    sales?.forEach(sale => {
      if (sale.tags) {
        sale.tags.forEach((tag: string) => allCategories.add(tag))
      }
    })
    
    return NextResponse.json({
      ok: true,
      totalSales: sales?.length || 0,
      withCategories: withCategories.length,
      withoutCategories: withoutCategories.length,
      uniqueCategories: Array.from(allCategories).sort(),
      sampleSales: sales?.slice(0, 5) || [],
      message: 'Categories check complete'
    })
    
  } catch (error: any) {
    console.error('[TEST-CATEGORIES] Unexpected error:', error)
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
