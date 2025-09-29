import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's sales
    const { data: sales, error: salesError } = await supabase
      .from('yard_sales')
      .select('id, title, date_start, time_start, address, status, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (salesError) {
      console.error('Error fetching user sales:', salesError)
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
    }

    return NextResponse.json(sales || [])

  } catch (error) {
    console.error('Error in GET /api/account/sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
