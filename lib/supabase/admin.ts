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
import { ENV_PUBLIC, ENV_SERVER } from '../env'

if (!ENV_SERVER.SUPABASE_SERVICE_ROLE) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE for admin client')
}

export const adminSupabase = createClient(
  ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_URL,
  ENV_SERVER.SUPABASE_SERVICE_ROLE,
  { 
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

// Get the schema name from environment variables
export const getSchemaName = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public'
}

// Helper function to get schema-qualified table name
export const getTableName = (tableName: string) => {
  const schema = getSchemaName()
  return schema === 'public' ? tableName : `${schema}.${tableName}`
}