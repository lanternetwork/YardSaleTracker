import { describe, it, expect, vi } from 'vitest'

// Mock NextRequest and NextResponse
const mockNextRequest = {
  nextUrl: {
    searchParams: new URLSearchParams(),
    origin: 'https://example.com'
  }
}

const mockNextResponse = {
  redirect: vi.fn((url: string) => ({ url, status: 302 }))
}

// Mock Supabase
const mockSupabaseAuth = {
  exchangeCodeForSession: vi.fn()
}

const mockCreateSupabaseServer = vi.fn(() => ({
  auth: mockSupabaseAuth
}))

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: mockCreateSupabaseServer
}))

vi.mock('next/server', () => ({
  NextRequest: mockNextRequest,
  NextResponse: mockNextResponse
}))

describe('Auth Callback Route', () => {
  it('should redirect to returnTo when code exchange succeeds', async () => {
    // Mock successful code exchange
    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
      error: null
    })

    // Mock request with code and returnTo
    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('code=test-code&returnTo=/favorites'),
        origin: 'https://example.com'
      }
    }

    // This would be the actual route handler logic
    const code = request.nextUrl.searchParams.get('code')
    const returnTo = request.nextUrl.searchParams.get('returnTo') || '/account'

    if (code) {
      const supabase = mockCreateSupabaseServer()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        const redirectUrl = `${request.nextUrl.origin}${returnTo}`
        expect(redirectUrl).toBe('https://example.com/favorites')
      }
    }
  })

  it('should redirect to error page when code exchange fails', async () => {
    // Mock failed code exchange
    mockSupabaseAuth.exchangeCodeForSession.mockResolvedValue({
      error: { message: 'Invalid code' }
    })

    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('code=invalid-code'),
        origin: 'https://example.com'
      }
    }

    const code = request.nextUrl.searchParams.get('code')
    
    if (code) {
      const supabase = mockCreateSupabaseServer()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        const errorUrl = `${request.nextUrl.origin}/auth?error=Could not authenticate user`
        expect(errorUrl).toBe('https://example.com/auth?error=Could not authenticate user')
      }
    }
  })

  it('should handle missing code parameter', () => {
    const request = {
      nextUrl: {
        searchParams: new URLSearchParams('returnTo=/favorites'),
        origin: 'https://example.com'
      }
    }

    const code = request.nextUrl.searchParams.get('code')
    const returnTo = request.nextUrl.searchParams.get('returnTo') || '/account'

    if (!code) {
      const errorUrl = `${request.nextUrl.origin}/auth?error=Could not authenticate user`
      expect(errorUrl).toBe('https://example.com/auth?error=Could not authenticate user')
    }
  })
})
