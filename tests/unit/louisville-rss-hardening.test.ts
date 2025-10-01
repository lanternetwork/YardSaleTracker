import { describe, it, expect } from 'vitest'

// URL normalization function (copied from trigger route for testing)
function normalizeUrl(link: string, feedUrl: string): string | null {
  try {
    // If link is already absolute, use it directly
    if (link.startsWith('http://') || link.startsWith('https://')) {
      const url = new URL(link)
      // Only accept craigslist.org URLs
      if (url.hostname.endsWith('.craigslist.org') || url.hostname === 'craigslist.org') {
        return url.toString()
      }
      return null // Reject non-craigslist URLs
    }
    
    // If link is relative, resolve against feed URL
    const feedUrlObj = new URL(feedUrl)
    const resolvedUrl = new URL(link, feedUrlObj.origin)
    
    // Only accept craigslist.org URLs
    if (resolvedUrl.hostname.endsWith('.craigslist.org') || resolvedUrl.hostname === 'craigslist.org') {
      return resolvedUrl.toString()
    }
    
    return null // Reject non-craigslist URLs
  } catch (error) {
    return null // Invalid URL
  }
}

describe('Louisville RSS Hardening', () => {
  const louisvilleFeedUrl = 'https://louisville.craigslist.org/search/gms?format=rss'

  it('should keep absolute Louisville craigslist URLs unchanged', () => {
    const absoluteUrl = 'https://louisville.craigslist.org/gms/d/louisville-garage-sale-furniture/1234567890.html'
    const result = normalizeUrl(absoluteUrl, louisvilleFeedUrl)
    expect(result).toBe(absoluteUrl)
  })

  it('should resolve relative URLs against Louisville feed origin', () => {
    const relativeUrl = '/gms/d/louisville-garage-sale-furniture/1234567890.html'
    const result = normalizeUrl(relativeUrl, louisvilleFeedUrl)
    expect(result).toBe('https://louisville.craigslist.org/gms/d/louisville-garage-sale-furniture/1234567890.html')
  })

  it('should reject non-craigslist absolute URLs', () => {
    const nonCraigslistUrl = 'https://example.com/garage-sale/123'
    const result = normalizeUrl(nonCraigslistUrl, louisvilleFeedUrl)
    expect(result).toBeNull()
  })

  it('should reject HTTP URLs (only HTTPS allowed)', () => {
    const httpUrl = 'http://louisville.craigslist.org/gms/d/garage-sale/123.html'
    const result = normalizeUrl(httpUrl, louisvilleFeedUrl)
    expect(result).toBeNull()
  })

  it('should handle Louisville-specific paths', () => {
    const louisvilleUrl = 'https://louisville.craigslist.org/gms/d/estate-sale-antiques/123.html'
    const result = normalizeUrl(louisvilleUrl, louisvilleFeedUrl)
    expect(result).toBe(louisvilleUrl)
  })

  it('should preserve query parameters and fragments', () => {
    const urlWithParams = 'https://louisville.craigslist.org/gms/d/garage-sale/123.html?utm_source=test#section'
    const result = normalizeUrl(urlWithParams, louisvilleFeedUrl)
    expect(result).toBe(urlWithParams)
  })

  it('should handle complex relative paths from Louisville feed', () => {
    const complexRelative = '../gms/d/garage-sale/123.html'
    const result = normalizeUrl(complexRelative, louisvilleFeedUrl)
    expect(result).toBe('https://louisville.craigslist.org/gms/d/garage-sale/123.html')
  })

  it('should reject invalid URLs', () => {
    const invalidUrl = 'not-a-url'
    const result = normalizeUrl(invalidUrl, louisvilleFeedUrl)
    expect(result).toBeNull()
  })

  it('should handle different Louisville subdomain variations', () => {
    const variations = [
      'https://louisville.craigslist.org/gms/d/garage-sale/123.html',
      'https://louisville.craigslist.org/gms/d/estate-sale/456.html',
      'https://louisville.craigslist.org/gms/d/moving-sale/789.html'
    ]

    variations.forEach(url => {
      const result = normalizeUrl(url, louisvilleFeedUrl)
      expect(result).toBe(url)
    })
  })

  it('should handle Louisville feed URL parsing', () => {
    const feedUrl = 'https://louisville.craigslist.org/search/gms?format=rss'
    const urlObj = new URL(feedUrl)
    expect(urlObj.hostname).toBe('louisville.craigslist.org')
    expect(urlObj.pathname).toBe('/search/gms')
    expect(urlObj.search).toBe('?format=rss')
  })
})
