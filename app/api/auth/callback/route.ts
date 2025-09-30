import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const redirectTo = searchParams.get('redirectTo') ?? '/'

  if (code) {
    const supabase = createSupabaseServerClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Get the user to trigger profile creation in middleware
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          console.log('User authenticated:', user.id)
        }
        
        // Redirect to the intended destination
        const finalRedirect = redirectTo !== '/' ? redirectTo : next
        return NextResponse.redirect(`${origin}${finalRedirect}`)
      }
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  // If there's an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
