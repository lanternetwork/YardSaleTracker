import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { getSchema } from './schema';

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const schema = getSchema();

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        cookies().set(name, value, options);
      },
      remove(name: string, options: any) {
        cookies().set(name, '', { ...options, maxAge: 0 });
      },
    },
    headers: {
      get(name: string) {
        return headers().get(name);
      },
    },
    db: { schema },
  });
}