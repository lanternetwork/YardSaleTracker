import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { getSchema } from './schema';

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const schema = getSchema();

  return createServerClient(url, anon, {
    cookies,
    headers,
    db: { schema },
  });
}