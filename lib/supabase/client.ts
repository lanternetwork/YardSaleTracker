import { createBrowserClient } from '@supabase/ssr'
import { ENV_PUBLIC } from '../env'

export const createSupabaseBrowser = () =>
  createBrowserClient(
    ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_URL,
    ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_ANON_KEY
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