import { createBrowserClient } from '@supabase/ssr'

export const createSupabaseBrowser = () => {
  // Use environment variables directly to avoid validation issues
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // During build time, return a mock client to prevent build failures
  if (!supabaseUrl || !supabaseKey) {
    if (typeof window === 'undefined') {
      // Server-side build time - return a mock client
      return {
        auth: {
          getUser: () => Promise.resolve({ data: { user: null }, error: null }),
          signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
          signUp: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } }),
          signOut: () => Promise.resolve({ error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
            })
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
              })
            })
          })
        }),
        rpc: () => Promise.resolve({ data: null, error: { message: 'Not available during build' } })
      } as any
    }
    throw new Error('Missing Supabase environment variables')
  }
  
  return createBrowserClient(supabaseUrl, supabaseKey)
}
