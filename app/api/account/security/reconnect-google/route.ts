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

    const { searchParams } = new URL(request.url)
    const returnTo = searchParams.get('returnTo') || '/account/security'

    // Redirect to Google OAuth for reconnection
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
      }
    })

    if (error) {
      console.error('Error initiating Google OAuth:', error)
      return NextResponse.json({ error: 'Failed to initiate Google reconnection' }, { status: 500 })
    }

    // Redirect to OAuth URL
    return NextResponse.redirect(data.url)

  } catch (error) {
    console.error('Error in GET /api/account/security/reconnect-google:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
