export function getSchema(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public';
}
