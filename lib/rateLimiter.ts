import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// In-memory store for development
const memoryStore = new Map<string, { count: number; resetTime: number }>()

// Redis client for production
let redis: Redis | null = null
let ratelimit: Ratelimit | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '15 m'),
  })
}

export interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: Request) => string // Custom key generator
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export class RateLimiter {
  private options: RateLimitOptions

  constructor(options: RateLimitOptions) {
    this.options = options
  }

  // Method to clear memory store for testing
  static clearMemoryStore(): void {
    memoryStore.clear()
  }

  async checkLimit(req: Request): Promise<RateLimitResult> {
    const key = this.options.keyGenerator ? 
      this.options.keyGenerator(req) : 
      this.getDefaultKey(req)

    const now = Date.now()
    const windowStart = now - this.options.windowMs

    if (ratelimit) {
      return this.checkLimitUpstash(key, now)
    } else {
      return this.checkLimitMemory(key, now, windowStart)
    }
  }

  private async checkLimitUpstash(key: string, now: number): Promise<RateLimitResult> {
    try {
      const { success, limit, reset } = await ratelimit!.limit(key)
      if (!success) {
        return {
          success: false,
          limit,
          remaining: 0,
          resetTime: reset,
          retryAfter: Math.ceil((reset - now) / 1000)
        }
      }
      // Note: @upstash/ratelimit returns remaining only with certain adapters; approximate here
      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - 1),
        resetTime: reset
      }
    } catch (error) {
      console.error('Redis rate limiting error:', error)
      // Fallback to allowing the request
      return {
        success: true,
        limit: this.options.maxRequests,
        remaining: this.options.maxRequests,
        resetTime: now + this.options.windowMs
      }
    }
  }

  private checkLimitMemory(key: string, now: number, windowStart: number): RateLimitResult {
    const entry = memoryStore.get(key)
    
    if (!entry || entry.resetTime <= now) {
      // New window or expired entry
      memoryStore.set(key, {
        count: 1,
        resetTime: now + this.options.windowMs
      })
      return {
        success: true,
        limit: this.options.maxRequests,
        remaining: this.options.maxRequests - 1,
        resetTime: now + this.options.windowMs
      }
    }

    if (entry.count >= this.options.maxRequests) {
      return {
        success: false,
        limit: this.options.maxRequests,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      }
    }

    // Increment counter
    entry.count++
    memoryStore.set(key, entry)

    return {
      success: true,
      limit: this.options.maxRequests,
      remaining: this.options.maxRequests - entry.count,
      resetTime: entry.resetTime
    }
  }

  private getDefaultKey(req: Request): string {
    // Use IP address as default key
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `rate_limit:${ip}`
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
})

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
  keyGenerator: (req) => {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `auth_rate_limit:${ip}`
  }
})

export const searchRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
})

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 uploads per minute
})

