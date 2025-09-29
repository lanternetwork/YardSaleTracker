import { createBrowserClient } from '@supabase/ssr'

export const createSupabaseBrowser = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  
  return createBrowserClient(url, key)
}

// Alias for compatibility
export const createSupabaseClient = createSupabaseBrowser