import { z } from 'zod'

// Server environment variables (not exposed to client)
const serverEnvSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  
  // Auth
  CRAIGSLIST_INGEST_TOKEN: z.string().optional(),
  
  // Feature flags (server)
  ENABLE_ADMIN: z.string().transform(val => val === 'true').default('true'),
  ENABLE_EXTENSION: z.string().transform(val => val === 'true').default('true'),
  ENABLE_EMAIL_INGEST: z.string().transform(val => val === 'true').default('false'),
  ENABLE_GATEWAY: z.string().transform(val => val === 'true').default('false'),
  
  // Optional services
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
})

// Public environment variables (exposed to client)
const publicEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  
  // App
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  
  // Maps
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
  
  // PWA
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  
  // Monitoring
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  
  // Feature flags (public)
  NEXT_PUBLIC_ENABLE_DEMO: z.string().transform(val => val === 'true').default('false'),
  NEXT_PUBLIC_ENABLE_DIAGNOSTICS: z.string().transform(val => val === 'true').default('false'),
})

// Validate server environment
function validateServerEnv() {
  try {
    return serverEnvSchema.parse(process.env)
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
      console.error('❌ Server environment validation failed:', error)
      throw error
    } else {
      console.warn('⚠️ Server environment validation failed in production:', error)
      // Return defaults for production resilience
      return serverEnvSchema.parse({})
    }
  }
}

// Validate public environment
function validatePublicEnv() {
  try {
    return publicEnvSchema.parse(process.env)
  } catch (error) {
    if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
      console.error('❌ Public environment validation failed:', error)
      throw error
    } else {
      console.warn('⚠️ Public environment validation failed in production:', error)
      // Return defaults for production resilience
      return publicEnvSchema.parse({})
    }
  }
}

// Export validated configs
export const serverEnv = validateServerEnv()
export const publicEnv = validatePublicEnv()

// Combined config for convenience
export const config = {
  server: serverEnv,
  public: publicEnv,
  
  // Helper functions
  isDevelopment: serverEnv.NODE_ENV === 'development',
  isProduction: serverEnv.NODE_ENV === 'production',
  isPreview: serverEnv.VERCEL_ENV === 'preview',
  
  // Feature flags
  features: {
    admin: serverEnv.ENABLE_ADMIN,
    extension: serverEnv.ENABLE_EXTENSION,
    emailIngest: serverEnv.ENABLE_EMAIL_INGEST,
    gateway: serverEnv.ENABLE_GATEWAY,
    demo: publicEnv.NEXT_PUBLIC_ENABLE_DEMO,
    diagnostics: publicEnv.NEXT_PUBLIC_ENABLE_DIAGNOSTICS,
  },
  
  // Service availability
  services: {
    supabase: !!publicEnv.NEXT_PUBLIC_SUPABASE_URL && !!publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    maps: !!publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    redis: !!serverEnv.UPSTASH_REDIS_REST_URL && !!serverEnv.UPSTASH_REDIS_REST_TOKEN,
    push: !!publicEnv.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!serverEnv.VAPID_PRIVATE_KEY,
    sentry: !!publicEnv.NEXT_PUBLIC_SENTRY_DSN,
  }
}

export default config
