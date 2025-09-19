import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { ENV_PUBLIC } from '../env'

export function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient(
    ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_URL,
    ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { 
      cookies: { 
        get: (name) => cookieStore.get(name)?.value 
      } 
    }
  )
}
