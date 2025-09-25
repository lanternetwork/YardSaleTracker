import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

function sanitizeReturnTo(returnTo: string | null): string {
  if (!returnTo) return '/'
  
  // Only allow relative paths, not external URLs
  if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
    return '/'
  }
  
  // Prevent redirect loops to auth pages
  if (returnTo === '/auth' || returnTo === '/auth/callback') {
    return '/'
  }
  
  // Ensure path starts with /
  if (!returnTo.startsWith('/')) {
    return '/'
  }
  
  return returnTo
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const returnTo = sanitizeReturnTo(searchParams.get('returnTo'))

  if (code) {
    const supabase = createSupabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession({ code })
    
    if (!error) {
      return NextResponse.redirect(`${origin}${returnTo}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate user`)
}
