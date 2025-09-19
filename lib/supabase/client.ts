import { createBrowserClient } from '@supabase/ssr'
import { ENV_PUBLIC } from '../env'

export const createSupabaseBrowser = () =>
  createBrowserClient(
    ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_URL,
    ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
