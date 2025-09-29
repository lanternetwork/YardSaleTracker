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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const serviceRole = process.env.SUPABASE_SERVICE_ROLE || 'placeholder-service-role'

export const adminSupabase = createClient(
  url,
  serviceRole,
  { 
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// Alias for compatibility
export const getAdminSupabase = () => adminSupabase