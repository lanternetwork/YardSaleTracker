import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Cancel deletion request
    const { error: cancelError } = await supabase
      .from('account_deletion_requests')
      .update({ 
        status: 'canceled',
        requested_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (cancelError) {
      console.error('Error canceling deletion request:', cancelError)
      return NextResponse.json({ error: 'Failed to cancel deletion request' }, { status: 500 })
    }

    // Restore user's sales to published status
    const { error: restoreError } = await supabase
      .from('yard_sales')
      .update({ 
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('owner_id', user.id)
      .eq('status', 'hidden')

    if (restoreError) {
      console.error('Error restoring user sales:', restoreError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in POST /api/account/delete/cancel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
