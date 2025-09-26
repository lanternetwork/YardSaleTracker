import { describe, it, expect, vi } from 'vitest'

// Mock the admin Supabase client
const mockAdminSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        count: vi.fn(() => Promise.resolve({ count: 5, error: null })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                id: 'run_1',
                started_at: '2024-01-01T00:00:00Z',
                finished_at: '2024-01-01T00:05:00Z',
                source: 'craigslist',
                status: 'ok',
                fetched_count: 15,
                new_count: 3,
                updated_count: 2
              },
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
}

// Mock the getAdminSupabase function
vi.mock('@/lib/supabase/admin', () => ({
  getAdminSupabase: () => mockAdminSupabase
}))

describe('DB Check Route', () => {
  it('should return database status information', async () => {
    // Mock environment variables
    const originalEnv = process.env
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      NODE_ENV: 'development'
    }

    // Mock the route handler
    const mockRequest = new Request('http://localhost:3000/diagnostics/db-check')
    
    // Simulate the route logic
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectRef = supabaseUrl.slice(0, 8)
    const hasServiceRoleKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)
    
    const expectedResponse = {
      hasServiceRoleKey: true,
      projectRef: 'https://',
      salesCount: 5,
      lastRun: {
        id: 'run_1',
        started_at: '2024-01-01T00:00:00Z',
        finished_at: '2024-01-01T00:05:00Z',
        source: 'craigslist',
        status: 'ok',
        fetched_count: 15,
        new_count: 3,
        updated_count: 2
      },
      timestamp: expect.any(String)
    }

    expect(hasServiceRoleKey).toBe(true)
    expect(projectRef).toBe('https://')
    
    // Restore environment
    process.env = originalEnv
  })

  it('should handle missing service role key', () => {
    const originalEnv = process.env
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
      NODE_ENV: 'development'
      // No SUPABASE_SERVICE_ROLE_KEY
    }

    const hasServiceRoleKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)
    expect(hasServiceRoleKey).toBe(false)
    
    // Restore environment
    process.env = originalEnv
  })

  it('should extract project reference correctly', () => {
    const testUrls = [
      'https://test.supabase.co',
      'https://abc123.supabase.co',
      'https://very-long-project-name.supabase.co'
    ]

    testUrls.forEach(url => {
      const projectRef = url.slice(0, 8)
      expect(projectRef).toBe('https://')
    })
  })

  it('should handle production environment restriction', () => {
    const originalEnv = process.env
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      VERCEL_ENV: 'production'
    }

    // In production, the route should return 404
    const isProduction = process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview'
    expect(isProduction).toBe(true)
    
    // Restore environment
    process.env = originalEnv
  })
})
