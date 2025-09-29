import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mock environment variables
const originalEnv = process.env

describe('Branding Configuration', () => {
  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  it('should default to LootAura when NEXT_PUBLIC_APP_NAME is not set', async () => {
    // Clear the environment variable
    delete process.env.NEXT_PUBLIC_APP_NAME
    
    // Dynamic import to get fresh module
    const { APP_NAME } = await import('@/lib/config/branding')
    
    expect(APP_NAME).toBe('LootAura')
  })

  it('should use NEXT_PUBLIC_APP_NAME when set', async () => {
    // Set custom app name
    process.env.NEXT_PUBLIC_APP_NAME = 'My Custom App'
    
    // Dynamic import to get fresh module
    const { APP_NAME } = await import('@/lib/config/branding')
    
    expect(APP_NAME).toBe('My Custom App')
  })

  it('should export all required branding constants', async () => {
    const branding = await import('@/lib/config/branding')
    
    expect(branding.APP_NAME).toBeDefined()
    expect(branding.APP_TAGLINE).toBeDefined()
    expect(branding.COMPANY_NAME).toBeDefined()
    expect(branding.PWA_NAME).toBeDefined()
    expect(branding.PWA_SHORT_NAME).toBeDefined()
    expect(branding.DEFAULT_TITLE).toBeDefined()
    expect(branding.DEFAULT_DESCRIPTION).toBeDefined()
  })

  it('should have consistent PWA naming', async () => {
    const { PWA_NAME, PWA_SHORT_NAME, APP_NAME } = await import('@/lib/config/branding')
    
    expect(PWA_NAME).toBe(APP_NAME)
    expect(PWA_SHORT_NAME).toBe(APP_NAME)
  })
})
