import { z } from 'zod'

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must be at least 10 characters'),
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().min(10, 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY must be at least 10 characters'),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(10).optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
})

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE: z.string().min(10, 'SUPABASE_SERVICE_ROLE must be at least 10 characters').optional(),
  VAPID_PRIVATE_KEY: z.string().min(10).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(10).optional(),
  NOMINATIM_APP_EMAIL: z.string().email().optional(),
})

// Validate public environment variables with build-time fallbacks
export const ENV_PUBLIC = (() => {
  try {
    const parsed = publicSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    })
    return parsed
  } catch (error) {
    if (process.env.VITEST) {
      // Normalize ZodError to a readable string for tests expecting includes()
      const message = (error as any)?.errors?.[0]?.message || String(error)
      throw new Error(message)
    }
    // During build time, return fallback values
    return {
      NEXT_PUBLIC_SUPABASE_URL: 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'placeholder-key',
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'placeholder-key',
      NEXT_PUBLIC_SITE_URL: 'https://lootaura.com',
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: undefined,
      NEXT_PUBLIC_SENTRY_DSN: undefined,
    }
  }
})()

// Validate server environment variables with build-time fallbacks
export const ENV_SERVER = (() => {
  try {
    return serverSchema.parse({
      SUPABASE_SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE,
      VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
      NOMINATIM_APP_EMAIL: process.env.NOMINATIM_APP_EMAIL,
    })
  } catch (error) {
    if (process.env.VITEST) throw error
    // During build time, return fallback values
    return {
      SUPABASE_SERVICE_ROLE: 'placeholder-service-role',
      VAPID_PRIVATE_KEY: undefined,
      UPSTASH_REDIS_REST_URL: undefined,
      UPSTASH_REDIS_REST_TOKEN: undefined,
      NOMINATIM_APP_EMAIL: undefined,
    }
  }
})()

// Type exports for better TypeScript support
export type PublicEnv = z.infer<typeof publicSchema>
export type ServerEnv = z.infer<typeof serverSchema>
