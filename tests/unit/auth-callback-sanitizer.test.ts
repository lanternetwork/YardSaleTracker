import { describe, it, expect } from 'vitest'

// Test the sanitizeReturnTo function logic
function sanitizeReturnTo(returnTo: string | null): string {
  if (!returnTo) return '/'
  
  // Only allow relative paths, not external URLs
  if (returnTo.startsWith('http://') || returnTo.startsWith('https://')) {
    return '/'
  }
  
  // Prevent redirect loops to auth pages
  if (returnTo === '/auth' || returnTo === '/auth/callback') {
    return '/'
  }
  
  // Ensure path starts with /
  if (!returnTo.startsWith('/')) {
    return '/'
  }
  
  return returnTo
}

describe('Auth Callback Sanitizer', () => {
  it('should allow safe relative paths', () => {
    expect(sanitizeReturnTo('/')).toBe('/')
    expect(sanitizeReturnTo('/favorites')).toBe('/favorites')
    expect(sanitizeReturnTo('/account')).toBe('/account')
    expect(sanitizeReturnTo('/sell/review')).toBe('/sell/review')
  })

  it('should block external URLs', () => {
    expect(sanitizeReturnTo('https://evil.com')).toBe('/')
    expect(sanitizeReturnTo('http://malicious.com')).toBe('/')
    expect(sanitizeReturnTo('https://example.com/steal-data')).toBe('/')
  })

  it('should prevent auth redirect loops', () => {
    expect(sanitizeReturnTo('/auth')).toBe('/')
    expect(sanitizeReturnTo('/auth/callback')).toBe('/')
  })

  it('should handle null/undefined inputs', () => {
    expect(sanitizeReturnTo(null)).toBe('/')
    expect(sanitizeReturnTo(undefined as any)).toBe('/')
  })

  it('should ensure paths start with /', () => {
    expect(sanitizeReturnTo('favorites')).toBe('/')
    expect(sanitizeReturnTo('account')).toBe('/')
  })

  it('should preserve valid relative paths', () => {
    expect(sanitizeReturnTo('/explore')).toBe('/explore')
    expect(sanitizeReturnTo('/sale/123')).toBe('/sale/123')
    expect(sanitizeReturnTo('/sell/new')).toBe('/sell/new')
  })
})
