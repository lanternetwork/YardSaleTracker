import { createBrowserClient } from '@supabase/ssr'

export const createSupabaseBrowser = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

// Alias for compatibility
export const createSupabaseClient = createSupabaseBrowser