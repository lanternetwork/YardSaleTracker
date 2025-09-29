/**
 * Unit tests for location center preference resolution
 */

import { describe, it, expect, vi } from 'vitest'
import { getInitialCenter } from '@/lib/location/center'

// Mock fetch for external API calls
global.fetch = vi.fn()

describe('Location Center Preference Resolution', () => {
  it('should prefer URL parameters over other sources', async () => {
    const url = new URL('https://example.com?lat=40.7128&lng=-74.0060&zip=10001&radius=10')
    const result = await getInitialCenter({ url })
    
    expect(result.lat).toBe(40.7128)
    expect(result.lng).toBe(-74.0060)
    expect(result.zip).toBe('10001')
    expect(result.radius).toBe(10)
    expect(result.source).toBe('url')
  })

  it('should use cookie when URL is not available', async () => {
    const cookies = {
      'la_center': JSON.stringify({
        lat: 37.7749,
        lng: -122.4194,
        radius: 25,
        zip: '94102',
        city: 'San Francisco',
        ts: Date.now()
      })
    }
    
    const result = await getInitialCenter({ cookies })
    
    expect(result.lat).toBe(37.7749)
    expect(result.lng).toBe(-122.4194)
    expect(result.zip).toBe('94102')
    expect(result.radius).toBe(25)
    expect(result.source).toBe('cookie')
  })

  it('should ignore expired cookies', async () => {
    const cookies = {
      'la_center': JSON.stringify({
        lat: 37.7749,
        lng: -122.4194,
        radius: 25,
        ts: Date.now() - (91 * 24 * 60 * 60 * 1000) // 91 days ago
      })
    }
    
    const result = await getInitialCenter({ cookies })
    
    // Should fall back to IP or fallback
    expect(result.source).not.toBe('cookie')
  })

  it('should use IP headers when available', async () => {
    const headers = new Headers({
      'x-vercel-ip-latitude': '38.2527',
      'x-vercel-ip-longitude': '-85.7585',
      'x-vercel-ip-city': 'Louisville'
    })
    
    const result = await getInitialCenter({ headers })
    
    expect(result.lat).toBe(38.2527)
    expect(result.lng).toBe(-85.7585)
    expect(result.city).toBe('Louisville, KY')
    expect(result.source).toBe('ip')
  })

  it('should override Cincinnati coordinates with Louisville', async () => {
    const headers = new Headers({
      'x-vercel-ip-latitude': '39.2899',
      'x-vercel-ip-longitude': '-84.5291',
      'x-vercel-ip-city': 'Cincinnati'
    })
    
    const result = await getInitialCenter({ headers })
    
    expect(result.lat).toBe(38.2527)
    expect(result.lng).toBe(-85.7585)
    expect(result.city).toBe('Louisville, KY')
    expect(result.source).toBe('ip')
  })

  it('should fall back to US center when all sources fail', async () => {
    const result = await getInitialCenter({})
    
    expect(result.lat).toBe(39.8283)
    expect(result.lng).toBe(-98.5795)
    expect(result.source).toBe('fallback')
    expect(result.city).toBe('United States')
  })

  it('should validate coordinate ranges', async () => {
    const headers = new Headers({
      'x-vercel-ip-latitude': '999', // Invalid latitude
      'x-vercel-ip-longitude': '-84.5291'
    })
    
    const result = await getInitialCenter({ headers })
    
    // Should fall back to US center
    expect(result.source).toBe('fallback')
  })
})
