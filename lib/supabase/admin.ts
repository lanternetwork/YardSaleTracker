/**
 * ⚠️  WARNING: ADMIN CLIENT - SERVER ONLY ⚠️
 * 
 * This file contains the admin Supabase client that uses the SERVICE_ROLE key.
 * NEVER import this file in client-side code (components, hooks, etc.).
 * 
 * This client bypasses Row Level Security (RLS) and should only be used for:
 * - Database migrations
 * - Admin operations
 * - Server-side data operations that require elevated privileges
 * 
 * Usage: Only in API routes, server actions, or build-time scripts
 */

import { createClient } from '@supabase/supabase-js'

// Use environment variables directly to avoid validation issues
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables for admin client')
}

export const adminSupabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  { 
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)
