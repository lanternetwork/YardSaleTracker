import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function createSupabaseServer() {
  const cookieStore = cookies()
  
  // Use environment variables directly to avoid validation issues
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    { 
      cookies: { 
        get: (name) => cookieStore.get(name)?.value 
      } 
    }
  )
}
