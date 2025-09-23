import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { geocodeAddress } from '@/lib/geocode'
import { getAddressFixtures } from '@/tests/utils/mocks'

// Mock environment variables
const originalEnv = process.env

describe('Geocoding Fallback', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should fallback to Nominatim when Google Maps fails', async () => {
    // Mock Google Maps API to fail
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'invalid-key'
    
    // Mock Nominatim to succeed
    const addresses = getAddressFixtures()
    const testAddress = addresses[0]
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid API key' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{
          lat: testAddress.lat.toString(),
          lon: testAddress.lng.toString(),
          display_name: testAddress.formatted_address,
          address: {
            city: testAddress.city,
            state: testAddress.state,
            postcode: testAddress.zip
          }
        }])
      })

    const result = await geocodeAddress(testAddress.address)
    
    expect(result).toEqual({
      lat: testAddress.lat,
      lng: testAddress.lng,
      formatted_address: testAddress.formatted_address,
      city: testAddress.city,
      state: testAddress.state,
      zip: testAddress.zip
    })
  })

  it('should return null when both Google and Nominatim fail', async () => {
    // Mock both APIs to fail
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'invalid-key'
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid API key' })
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Nominatim error' })
      })

    const result = await geocodeAddress('Invalid Address That Should Fail')
    
    expect(result).toBeNull()
  })

  it('should use Google Maps when API key is valid', async () => {
    // Mock Google Maps API to succeed
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'valid-key'
    
    const addresses = getAddressFixtures()
    const testAddress = addresses[0]
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          geometry: {
            location: {
              lat: testAddress.lat,
              lng: testAddress.lng
            }
          },
          formatted_address: testAddress.formatted_address,
          address_components: [
            { long_name: testAddress.city, types: ['locality'] },
            { short_name: testAddress.state, types: ['administrative_area_level_1'] },
            { long_name: testAddress.zip, types: ['postal_code'] }
          ]
        }]
      })
    })

    const result = await geocodeAddress(testAddress.address)
    
    expect(result).toEqual({
      lat: testAddress.lat,
      lng: testAddress.lng,
      formatted_address: testAddress.formatted_address,
      city: testAddress.city,
      state: testAddress.state,
      zip: testAddress.zip
    })
    
    // Should not call Nominatim
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should handle Nominatim rate limiting gracefully', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'invalid-key'
    process.env.NOMINATIM_APP_EMAIL = 'test@example.com'
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid API key' })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: 'Rate limited' })
      })

    const result = await geocodeAddress('Test Address')
    
    expect(result).toBeNull()
  })

  it('should include proper headers for Nominatim requests', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'invalid-key'
    process.env.NOMINATIM_APP_EMAIL = 'test@example.com'
    
    const addresses = getAddressFixtures()
    const testAddress = addresses[0]
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid API key' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{
          lat: testAddress.lat.toString(),
          lon: testAddress.lng.toString(),
          display_name: testAddress.formatted_address
        }])
      })

    await geocodeAddress(testAddress.address)
    
    const nominatimCall = (global.fetch as any).mock.calls[1]
    expect(nominatimCall[0]).toContain('nominatim.openstreetmap.org')
    expect(nominatimCall[0]).toContain(`email=${encodeURIComponent('test@example.com')}`)
  })

  it('should cache results to avoid repeated API calls', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'valid-key'
    
    const addresses = getAddressFixtures()
    const testAddress = addresses[0]
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        results: [{
          geometry: {
            location: {
              lat: testAddress.lat,
              lng: testAddress.lng
            }
          },
          formatted_address: testAddress.formatted_address,
          address_components: []
        }]
      })
    })

    // First call
    const result1 = await geocodeAddress(testAddress.address)
    expect(result1).toBeTruthy()
    
    // Second call should use cache
    const result2 = await geocodeAddress(testAddress.address)
    expect(result2).toEqual(result1)
    
    // Should only call API once due to caching
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should handle malformed Nominatim responses', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'invalid-key'
    
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid API key' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]) // Empty array
      })

    const result = await geocodeAddress('Test Address')
    
    expect(result).toBeNull()
  })

  it('should handle network errors gracefully', async () => {
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'invalid-key'
    
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))

    const result = await geocodeAddress('Test Address')
    
    expect(result).toBeNull()
  })
})
