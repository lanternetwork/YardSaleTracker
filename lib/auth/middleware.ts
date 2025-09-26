import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

const AUTH_REQUIRED_ROUTES = [
  '/sell/review',
  '/sell/publish', 
  '/favorites',
  '/account'
]

const DIAGNOSTICS_ROUTES = [
  '/diagnostics/ingest',
  '/diagnostics/ingest/console',
  '/diagnostics/db-check',
  '/_diag/ingest'
]

const STATIC_ASSETS = [
  'manifest.json',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'sw.js'
]

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip auth checks for static assets
  if (STATIC_ASSETS.some(asset => pathname.includes(asset)) || 
      pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) {
    return NextResponse.next()
  }
  
  // Skip auth checks for diagnostics routes
  if (DIAGNOSTICS_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Check if route requires auth
  const requiresAuth = AUTH_REQUIRED_ROUTES.some(route => pathname.startsWith(route))
  
  if (!requiresAuth) {
    return NextResponse.next()
  }
  
  // Check for valid session
  const supabase = createSupabaseServer()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    const returnTo = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/auth?returnTo=${returnTo}`, request.url))
  }
  
  // Add no-cache headers for auth-required pages
  const response = NextResponse.next()
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

