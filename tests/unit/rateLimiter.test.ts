import { describe, it, expect, beforeEach, vi } from 'vitest'
import { RateLimiter, clearMemoryStore } from '@/lib/rateLimiter'

// Clear memory store before each test
beforeEach(() => {
  clearMemoryStore()
  vi.clearAllMocks()
})

// Mock the Upstash Redis client
vi.mock('@upstash/redis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    set: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    pipeline: vi.fn(() => ({
      incr: vi.fn(),
      expire: vi.fn(),
      exec: vi.fn()
    }))
  }))
}))

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter
  let mockRequest: Request

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5
    })

    mockRequest = new Request('https://example.com/api/test', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1'
      }
    })
  })

  it('should allow requests within limit', async () => {
    const result = await rateLimiter.checkLimit(mockRequest)
    
    expect(result.success).toBe(true)
    expect(result.limit).toBe(5)
    expect(result.remaining).toBe(4)
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })

  it('should reject requests over limit', async () => {
    // Make 5 requests to reach the limit
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkLimit(mockRequest)
    }

    // The 6th request should be rejected
    const result = await rateLimiter.checkLimit(mockRequest)
    
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeDefined()
  })

  it('should reset after window expires', async () => {
    // Create a rate limiter with a very short window
    const shortWindowLimiter = new RateLimiter({
      windowMs: 100, // 100ms
      maxRequests: 2
    })

    // Make 2 requests to reach the limit
    await shortWindowLimiter.checkLimit(mockRequest)
    await shortWindowLimiter.checkLimit(mockRequest)

    // Should be rejected
    let result = await shortWindowLimiter.checkLimit(mockRequest)
    expect(result.success).toBe(false)

    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should be allowed again
    result = await shortWindowLimiter.checkLimit(mockRequest)
    expect(result.success).toBe(true)
  })

  it('should use custom key generator', async () => {
    const customLimiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 5,
      keyGenerator: (req) => 'custom-key'
    })

    const result = await customLimiter.checkLimit(mockRequest)
    expect(result.success).toBe(true)
  })

  it('should handle different IP addresses separately', async () => {
    const request1 = new Request('https://example.com/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.1' }
    })
    const request2 = new Request('https://example.com/api/test', {
      headers: { 'x-forwarded-for': '192.168.1.2' }
    })

    // Both should be allowed since they're different IPs
    const result1 = await rateLimiter.checkLimit(request1)
    const result2 = await rateLimiter.checkLimit(request2)

    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
  })

  it('should handle requests without IP address', async () => {
    const requestWithoutIP = new Request('https://example.com/api/test')
    
    const result = await rateLimiter.checkLimit(requestWithoutIP)
    expect(result.success).toBe(true)
  })
})
