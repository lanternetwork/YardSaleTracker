'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getSchema } from './schema';

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const schema = getSchema();
  return createBrowserClient(url, anon, { db: { schema } });
}