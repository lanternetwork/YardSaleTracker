import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter, authRateLimiter, searchRateLimiter, uploadRateLimiter } from '@/lib/rateLimiter'
import { authMiddleware } from '@/lib/auth/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Auth gating for protected routes
  const authResponse = await authMiddleware(request)
  if (authResponse.status !== 200) {
    return authResponse
  }

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
  const isPreview = process.env.VERCEL_ENV === 'preview'
  const scriptSrcBase = [
    "'self'",
    "'unsafe-eval'",
    "'unsafe-inline'",
    'https://maps.googleapis.com',
    'https://maps.gstatic.com',
  ]
  if (isPreview) {
    // Allow Vercel Feedback script only on preview
    scriptSrcBase.push('https://vercel.live')
  }
  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrcBase.join(' ')}`,
    `script-src-elem ${scriptSrcBase.join(' ')}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co https://*.supabase.com wss://*.supabase.co https://maps.googleapis.com https://maps.gstatic.com",
    "frame-src 'self' https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests'
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
    // Exclude common public assets and PWA files from middleware
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|site.webmanifest|robots.txt|sitemap.xml|sw.js|icon.*|apple-touch-icon.*|assets/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
