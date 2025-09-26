import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function createSupabaseServer() {
  // Use environment variables directly to avoid validation issues
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    // During static export, return a mock client to avoid build errors
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      return {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          signOut: () => Promise.resolve({ error: null })
        },
        from: () => ({
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
          insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
          delete: () => ({ eq: () => Promise.resolve({ error: null }) })
        })
      } as any
    }
    throw new Error('Missing Supabase environment variables')
  }
  
  try {
    const cookieStore = cookies()
    return createServerClient(
      supabaseUrl,
      supabaseKey,
      { 
        cookies: { 
          get: (name) => cookieStore.get(name)?.value 
        } 
      }
    )
  } catch (error) {
    // During build time, cookies() might not be available
    return createServerClient(
      supabaseUrl,
      supabaseKey,
      { 
        cookies: { 
          get: () => undefined 
        } 
      }
    )
  }
}
