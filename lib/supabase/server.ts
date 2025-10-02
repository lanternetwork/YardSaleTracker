import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSchema } from './schema';

// Log schema at server startup (once)
let schemaLogged = false;
function logSchemaOnce() {
  if (!schemaLogged) {
    const schema = getSchema();
    console.log(`[Supabase] Using schema: ${schema}`);
    schemaLogged = true;
  }
}

export function createSupabaseServerClient() {
  // Validate required environment variables
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    const error = 'NEXT_PUBLIC_SUPABASE_URL is missing';
    console.error(`[Supabase Server] ${error}`);
    throw new Error(error);
  }

  if (!anon) {
    const error = 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing';
    console.error(`[Supabase Server] ${error}`);
    throw new Error(error);
  }

  // Log schema once at startup
  logSchemaOnce();

  const schema = getSchema();
  const cookieStore = cookies()

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options, maxAge: 0 })
      },
    },
    db: { schema: 'public' }, // We use fully qualified names for v2 tables
  });
}

export async function ensureUserProfile(supabase: ReturnType<typeof createServerClient>) {
  // Try to get user session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ensured: false }

  // Build display name from email prefix if missing
  const email = user.email || ''
  const display = email.includes('@') ? email.split('@')[0] : email

  // Upsert into lootaura_v2.profiles by idempotent key user_id
  // Note: fully-qualified table name; rely on RLS (must allow owner upsert or use service role in admin context)
  const { error } = await (supabase as any)
    .from('lootaura_v2.profiles')
    .upsert({ user_id: user.id, display_name: display }, { onConflict: 'user_id' })

  if (error) {
    console.warn('[Profile] ensureUserProfile upsert failed:', error.message)
    return { ensured: false, error: error.message }
  }

  return { ensured: true }
}