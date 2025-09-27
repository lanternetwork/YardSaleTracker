import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const returnTo = searchParams.get('returnTo') || '/explore'

  if (code) {
    const supabase = createSupabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Successful authentication, redirect to returnTo
      return NextResponse.redirect(`${origin}${returnTo}`)
    }
  }

  // If there's an error or no code, redirect to sign-in with error
  return NextResponse.redirect(`${origin}/signin?error=auth_callback_failed`)
}
