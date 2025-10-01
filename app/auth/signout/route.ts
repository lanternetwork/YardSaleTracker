import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    await supabase.auth.signOut()
  } catch (error) {
    // Handle missing environment variables gracefully during static export
    console.warn('Supabase not configured, skipping signout:', error)
  }
  
  return NextResponse.redirect(new URL('/', request.url))
}
