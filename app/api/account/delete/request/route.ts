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

    // Create or update deletion request
    const { data: deletionRequest, error: requestError } = await supabase
      .from('account_deletion_requests')
      .upsert({
        user_id: user.id,
        status: 'pending',
        requested_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (requestError) {
      console.error('Error creating deletion request:', requestError)
      return NextResponse.json({ error: 'Failed to request account deletion' }, { status: 500 })
    }

    // Hide all user's sales immediately
    const { error: hideError } = await supabase
      .from('yard_sales')
      .update({ 
        status: 'hidden',
        updated_at: new Date().toISOString()
      })
      .eq('owner_id', user.id)

    if (hideError) {
      console.error('Error hiding user sales:', hideError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json({ success: true, deletionRequest })

  } catch (error) {
    console.error('Error in POST /api/account/delete/request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
