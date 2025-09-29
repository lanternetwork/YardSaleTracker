import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter, authRateLimiter, searchRateLimiter, uploadRateLimiter } from '@/lib/rateLimiter'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limiting
  if (pathname.startsWith('/api/')) {
    let rateLimitResult

    if (pathname.startsWith('/api/auth/')) {
      rateLimitResult = await authRateLimiter.checkLimit(request)
    } else if (pathname.startsWith('/api/search/')) {
      rateLimitResult = await searchRateLimiter.checkLimit(request)
    } else if (pathname.startsWith('/api/upload/')) {
      rateLimitResult = await uploadRateLimiter.checkLimit(request)
    } else {
      rateLimitResult = await apiRateLimiter.checkLimit(request)
    }

    if (!rateLimitResult.success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString()
          }
        }
      )
    }
  }

  // Security headers
  const response = NextResponse.next()

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.supabase.co https://*.supabase.com wss://*.supabase.co",
    "frame-src 'self' https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  // Other security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // HSTS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // Rate limit headers
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', '99')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
