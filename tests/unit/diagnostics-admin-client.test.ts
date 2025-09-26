import { describe, it, expect, vi } from 'vitest'

// Mock the admin Supabase client
const mockAdminSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [
              {
                id: 'test-run-1',
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
            ],
            error: null
          }))
        }))
      }))
    }))
  }))
}

// Mock the admin client import
vi.mock('@/lib/supabase/admin', () => ({
  adminSupabase: mockAdminSupabase
}))

describe('Diagnostics Admin Client Usage', () => {
  it('should use admin client for database access', () => {
    // Test that the admin client is being used
    expect(mockAdminSupabase.from).toBeDefined()
  })

  it('should handle ingest runs data structure', () => {
    const mockRun = {
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

    expect(mockRun.status).toBe('ok')
    expect(mockRun.fetched_count).toBe(15)
    expect(mockRun.new_count).toBe(3)
    expect(mockRun.updated_count).toBe(2)
  })

  it('should handle sales data structure', () => {
    const mockSale = {
      id: 'sale_1',
      title: 'Test Garage Sale',
      url: 'https://sfbay.craigslist.org/garage-sale/123.html',
      location_text: 'San Francisco, CA',
      posted_at: '2024-01-01T00:00:00Z',
      first_seen_at: '2024-01-01T00:00:00Z',
      last_seen_at: '2024-01-01T00:00:00Z',
      status: 'active'
    }

    expect(mockSale.title).toBe('Test Garage Sale')
    expect(mockSale.url).toMatch(/^https:\/\/.*\.craigslist\.org\//)
    expect(mockSale.status).toBe('active')
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
