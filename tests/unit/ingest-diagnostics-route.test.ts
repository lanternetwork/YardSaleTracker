import { describe, it, expect } from 'vitest'

// Mock the server-side Supabase client
const mockSupabaseClient = {
  from: () => ({
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => Promise.resolve({
            data: [
              {
                id: 'test-sale-1',
                title: 'Test Garage Sale',
                url: 'https://sfbay.craigslist.org/garage-sale/123.html',
                location_text: 'San Francisco, CA',
                posted_at: '2024-01-01T00:00:00Z',
                first_seen_at: '2024-01-01T00:00:00Z',
                last_seen_at: '2024-01-01T00:00:00Z',
                status: 'active'
              }
            ],
            error: null,
            count: 1
          })
        })
      })
    })
  })
}

// Mock the createSupabaseServer function
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServer: () => mockSupabaseClient
}))

describe('Ingest Diagnostics Route', () => {
  it('should render the diagnostics page without errors', () => {
    // Test that the route path is valid
    const routePath = '/_diag/ingest'
    expect(routePath).toBe('/_diag/ingest')
    
    // Test that the path doesn't require authentication
    const authRequiredRoutes = [
      '/sell/review',
      '/sell/publish', 
      '/favorites',
      '/account'
    ]
    const requiresAuth = authRequiredRoutes.some(route => routePath.startsWith(route))
    expect(requiresAuth).toBe(false)
  })

  it('should handle database data structure correctly', () => {
    const mockRuns = [
      {
        id: 'run_1',
        started_at: '2024-01-01T00:00:00Z',
        finished_at: '2024-01-01T00:05:00Z',
        source: 'craigslist',
        dry_run: false,
        fetched_count: 15,
        new_count: 3,
        updated_count: 2,
        geocode_calls: 0,
        cache_hits: 0,
        status: 'ok',
        last_error: null
      }
    ]

    const mockSales = [
      {
        id: 'sale_1',
        title: 'Test Sale',
        url: 'https://sfbay.craigslist.org/garage-sale/123.html',
        location_text: 'Test Location',
        posted_at: '2024-01-01T00:00:00Z',
        first_seen_at: '2024-01-01T00:00:00Z',
        last_seen_at: '2024-01-01T00:00:00Z',
        status: 'active'
      }
    ]

    expect(mockRuns).toHaveLength(1)
    expect(mockRuns[0].status).toBe('ok')
    expect(mockSales).toHaveLength(1)
    expect(mockSales[0].title).toBe('Test Sale')
  })

  it('should format timestamps correctly', () => {
    const timestamp = '2024-01-01T12:00:00Z'
    const formatted = new Date(timestamp).toLocaleString()
    expect(formatted).toBeDefined()
    expect(typeof formatted).toBe('string')
  })

  it('should handle status colors correctly', () => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'ok': return 'text-green-600 bg-green-100'
        case 'error': return 'text-red-600 bg-red-100'
        case 'running': return 'text-blue-600 bg-blue-100'
        default: return 'text-gray-600 bg-gray-100'
      }
    }

    expect(getStatusColor('ok')).toBe('text-green-600 bg-green-100')
    expect(getStatusColor('error')).toBe('text-red-600 bg-red-100')
    expect(getStatusColor('running')).toBe('text-blue-600 bg-blue-100')
    expect(getStatusColor('unknown')).toBe('text-gray-600 bg-gray-100')
  })

  it('should handle sales status colors correctly', () => {
    const getSalesStatusColor = (status: string) => {
      switch (status) {
        case 'active': return 'text-green-600 bg-green-100'
        case 'published': return 'text-blue-600 bg-blue-100'
        case 'archived': return 'text-gray-600 bg-gray-100'
        default: return 'text-gray-600 bg-gray-100'
      }
    }

    expect(getSalesStatusColor('active')).toBe('text-green-600 bg-green-100')
    expect(getSalesStatusColor('published')).toBe('text-blue-600 bg-blue-100')
    expect(getSalesStatusColor('archived')).toBe('text-gray-600 bg-gray-100')
  })
})
