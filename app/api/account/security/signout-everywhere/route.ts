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

    // Sign out all sessions by invalidating the current session
    // This is a simplified approach - in production you might want to use
    // Supabase's admin API to revoke all sessions for a user
    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      console.error('Error signing out everywhere:', signOutError)
      return NextResponse.json({ error: 'Failed to sign out everywhere' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in POST /api/account/security/signout-everywhere:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
