import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createSupabaseServer()
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/', request.url))
}
