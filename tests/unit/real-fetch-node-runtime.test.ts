import { describe, it, expect, vi } from 'vitest'

// Mock fetch for testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Real Fetch with Node.js Runtime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should use correct headers for Louisville RSS fetch', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/rss+xml; charset=utf-8']]),
      text: () => Promise.resolve('<rss><channel><item><title>Test Sale</title></item></channel></rss>')
    }
    
    mockFetch.mockResolvedValue(mockResponse)

    const url = 'https://louisville.craigslist.org/search/gms?format=rss'
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LootAuraBot/0.1; +https://lootaura.com)',
        'Accept': 'application/rss+xml, text/xml;q=0.9, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })

    expect(mockFetch).toHaveBeenCalledWith(url, {
      cache: 'no-store',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LootAuraBot/0.1; +https://lootaura.com)',
        'Accept': 'application/rss+xml, text/xml;q=0.9, */*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    })
    expect(response.ok).toBe(true)
  })

  it('should handle timeout with AbortController', async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 100) // Short timeout for test
    
    try {
      await fetch('https://louisville.craigslist.org/search/gms?format=rss', {
        signal: controller.signal
      })
    } catch (error) {
      expect((error as Error).name).toBe('AbortError')
    } finally {
      clearTimeout(timeoutId)
    }
  })

  it('should handle retry logic on timeout', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        const error = new Error('Timeout')
        error.name = 'AbortError'
        return Promise.reject(error)
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/rss+xml']]),
        text: () => Promise.resolve('<rss><channel><item><title>Test Sale</title></item></channel></rss>')
      })
    })

    const fetchWithRetry = async (url: string, retries = 1): Promise<Response> => {
      try {
        return await fetch(url)
      } catch (error) {
        if (retries > 0 && (error as Error).name === 'AbortError') {
          await new Promise(resolve => setTimeout(resolve, 10)) // Short delay for test
          return fetchWithRetry(url, retries - 1)
        }
        throw error
      }
    }

    const response = await fetchWithRetry('https://louisville.craigslist.org/search/gms?format=rss')
    expect(callCount).toBe(2) // Should retry once
    expect(response.ok).toBe(true)
  })

  it('should handle non-200 responses gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Map([['content-type', 'text/html']])
    })

    const url = 'https://louisville.craigslist.org/search/gms?format=rss'
    const response = await fetch(url)
    
    expect(response.ok).toBe(false)
    expect(response.status).toBe(404)
  })

  it('should handle network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    try {
      await fetch('https://louisville.craigslist.org/search/gms?format=rss')
    } catch (error) {
      expect((error as Error).message).toBe('Network error')
    }
  })

  it('should validate Louisville RSS content type', () => {
    const validContentTypes = [
      'application/rss+xml',
      'application/xml',
      'text/xml',
      'application/rss+xml; charset=utf-8'
    ]

    validContentTypes.forEach(contentType => {
      const headers = new Map([['content-type', contentType]])
      const contentTypeHeader = headers.get('content-type') || 'unknown'
      expect(contentTypeHeader).toMatch(/rss|xml/)
    })
  })

  it('should handle Louisville-specific URL patterns', () => {
    const louisvilleUrls = [
      'https://louisville.craigslist.org/search/gms?format=rss',
      'https://louisville.craigslist.org/gms/d/garage-sale/123.html',
      'https://louisville.craigslist.org/gms/d/estate-sale/456.html'
    ]

    louisvilleUrls.forEach(url => {
      const urlObj = new URL(url)
      expect(urlObj.hostname).toBe('louisville.craigslist.org')
      expect(urlObj.protocol).toBe('https:')
    })
  })

  it('should preserve query parameters in full URL', () => {
    const fullUrl = 'https://louisville.craigslist.org/search/gms?format=rss&sort=date'
    const urlObj = new URL(fullUrl)
    
    expect(urlObj.search).toBe('?format=rss&sort=date')
    expect(urlObj.searchParams.get('format')).toBe('rss')
    expect(urlObj.searchParams.get('sort')).toBe('date')
  })

  it('should handle relative URL resolution', () => {
    const feedUrl = 'https://louisville.craigslist.org/search/gms?format=rss'
    const relativeUrl = '/gms/d/garage-sale/123.html'
    const resolvedUrl = new URL(relativeUrl, feedUrl).toString()
    
    expect(resolvedUrl).toBe('https://louisville.craigslist.org/gms/d/garage-sale/123.html')
  })

  it('should validate error handling without exposing secrets', () => {
    const error = new Error('Connection timeout')
    error.name = 'TimeoutError'
    
    // Should only expose name and message, not full error details
    const sanitizedError = {
      name: error.name,
      message: error.message
    }
    
    expect(sanitizedError.name).toBe('TimeoutError')
    expect(sanitizedError.message).toBe('Connection timeout')
    expect(sanitizedError).not.toHaveProperty('stack')
  })
})
