import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch for testing
global.fetch = vi.fn()

describe('ZIP Geocoding API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle valid ZIP code', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve([{
        lat: '40.7128',
        lon: '-74.0060',
        address: {
          city: 'New York',
          state: 'NY',
          country_code: 'us'
        }
      }])
    }
    
    ;(global.fetch as any).mockResolvedValue(mockResponse)

    const response = await fetch('/api/geocode/zip?zip=10001')
    const data = await response.json()

    expect(data.lat).toBe(40.7128)
    expect(data.lng).toBe(-74.0060)
    expect(data.zip).toBe('10001')
    expect(data.city).toBe('New York')
    expect(data.state).toBe('NY')
  })

  it('should handle invalid ZIP code format', async () => {
    const mockResponse = {
      ok: false,
      status: 400
    }
    
    ;(global.fetch as any).mockResolvedValue(mockResponse)

    const response = await fetch('/api/geocode/zip?zip=123')
    
    expect(response.ok).toBe(false)
    expect(response.status).toBe(400)
  })

  it('should handle ZIP code not found', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve([])
    }
    
    ;(global.fetch as any).mockResolvedValue(mockResponse)

    const response = await fetch('/api/geocode/zip?zip=99999')
    
    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })
})
