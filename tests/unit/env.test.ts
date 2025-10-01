import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Environment Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should validate required public environment variables', async () => {
    // Set up valid environment
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key-1234567890'

    const { ENV_PUBLIC } = await import('@/lib/env')

    expect(ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co')
    expect(ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key-1234567890')
    expect(ENV_PUBLIC.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).toBe('test-maps-key-1234567890')
  })

  it('should validate required server environment variables', async () => {
    // Set up valid environment
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key-1234567890'
    process.env.SUPABASE_SERVICE_ROLE = 'test-service-role-1234567890'

    const { ENV_SERVER } = await import('@/lib/env')

    expect(ENV_SERVER.SUPABASE_SERVICE_ROLE).toBe('test-service-role-1234567890')
  })

  it('should use fallback values for missing required public variables', async () => {
    // Clear required variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    // Clear the module cache to force re-import
    vi.resetModules()

    // Mock the environment to be empty
    const originalEnv = process.env
    process.env = { NODE_ENV: 'test' }

    const { ENV_PUBLIC } = await import('@/lib/env')

    expect(ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_URL).toBe('https://placeholder.supabase.co')
    expect(ENV_PUBLIC.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('placeholder-key')
    expect(ENV_PUBLIC.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).toBe('placeholder-key')

    // Restore original env
    process.env = originalEnv
  })

  it('should throw error for invalid URL format', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-url'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key-1234567890'

    await expect(async () => {
      await import('@/lib/env')
    }).rejects.toThrow('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
  })

  it('should throw error for short API keys', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'short'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key-1234567890'

    await expect(async () => {
      await import('@/lib/env')
    }).rejects.toThrow('NEXT_PUBLIC_SUPABASE_ANON_KEY must be at least 10 characters')
  })

  it('should handle optional environment variables', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key-1234567890'
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com'
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key-1234567890'

    const { ENV_PUBLIC } = await import('@/lib/env')

    expect(ENV_PUBLIC.NEXT_PUBLIC_SITE_URL).toBe('https://example.com')
    expect(ENV_PUBLIC.NEXT_PUBLIC_VAPID_PUBLIC_KEY).toBe('test-vapid-key-1234567890')
  })

  it('should handle missing optional variables', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key-1234567890'

    const { ENV_PUBLIC } = await import('@/lib/env')

    expect(ENV_PUBLIC.NEXT_PUBLIC_SITE_URL).toBeUndefined()
    expect(ENV_PUBLIC.NEXT_PUBLIC_VAPID_PUBLIC_KEY).toBeUndefined()
  })

  it('should validate email format for NOMINATIM_APP_EMAIL', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key-1234567890'
    process.env.SUPABASE_SERVICE_ROLE = 'test-service-role-1234567890'
    process.env.NOMINATIM_APP_EMAIL = 'invalid-email'

    await expect(async () => {
      await import('@/lib/env')
    }).rejects.toThrow('Invalid email')
  })

  it('should accept valid email for NOMINATIM_APP_EMAIL', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-1234567890'
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-maps-key-1234567890'
    process.env.SUPABASE_SERVICE_ROLE = 'test-service-role-1234567890'
    process.env.NOMINATIM_APP_EMAIL = 'test@example.com'

    const { ENV_SERVER } = await import('@/lib/env')

    expect(ENV_SERVER.NOMINATIM_APP_EMAIL).toBe('test@example.com')
  })
})
