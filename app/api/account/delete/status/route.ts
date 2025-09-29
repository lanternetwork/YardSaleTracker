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

    // Get deletion request status
    const { data: deletionRequest, error: fetchError } = await supabase
      .from('account_deletion_requests')
      .select('status, requested_at')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching deletion request:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch deletion status' }, { status: 500 })
    }

    return NextResponse.json(deletionRequest || null)

  } catch (error) {
    console.error('Error in GET /api/account/delete/status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
