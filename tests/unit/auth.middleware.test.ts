import { NextRequest } from 'next/server'
import { authMiddleware } from '@/lib/auth/middleware'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: jest.fn(() => ({
    auth: {
      getSession: jest.fn()
    }
  }))
}))

describe('authMiddleware', () => {
  const createMockRequest = (pathname: string) => ({
    nextUrl: { pathname },
    url: `https://example.com${pathname}`
  } as NextRequest)

  it('should allow static assets without auth check', async () => {
    const request = createMockRequest('/manifest.json')
    const response = await authMiddleware(request)
    expect(response.status).toBe(200)
  })

  it('should allow public routes without auth check', async () => {
    const request = createMockRequest('/')
    const response = await authMiddleware(request)
    expect(response.status).toBe(200)
  })

  it('should redirect to auth for protected routes when not authenticated', async () => {
    const { createSupabaseServer } = require('@/lib/supabase/server')
    createSupabaseServer.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } })
      }
    })

    const request = createMockRequest('/favorites')
    const response = await authMiddleware(request)
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('/auth?returnTo=')
  })

  it('should allow access to protected routes when authenticated', async () => {
    const { createSupabaseServer } = require('@/lib/supabase/server')
    createSupabaseServer.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({ 
          data: { session: { user: { id: 'test-user' } } } 
        })
      }
    })

    const request = createMockRequest('/favorites')
    const response = await authMiddleware(request)
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
  })

  it('should handle multiple protected routes', async () => {
    const { createSupabaseServer } = require('@/lib/supabase/server')
    createSupabaseServer.mockReturnValue({
      auth: {
        getSession: jest.fn().mockResolvedValue({ data: { session: null } })
      }
    })

    const protectedRoutes = ['/sell/review', '/sell/publish', '/favorites', '/account']
    
    for (const route of protectedRoutes) {
      const request = createMockRequest(route)
      const response = await authMiddleware(request)
      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toContain('/auth?returnTo=')
    }
  })
})
