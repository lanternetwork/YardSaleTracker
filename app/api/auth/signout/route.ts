import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Sign out the user
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Sign out error:', error)
      return NextResponse.json({ error: 'Failed to sign out' }, { status: 500 })
    }

    // Clear any additional cookies if needed
    const cookieStore = cookies()
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')

    // Redirect to home page
    return NextResponse.redirect(new URL('/', request.url))
  } catch (error) {
    console.error('Unexpected sign out error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}