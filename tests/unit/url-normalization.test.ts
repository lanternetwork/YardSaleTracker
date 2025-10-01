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

describe('URL Normalization', () => {
  const feedUrl = 'https://sfbay.craigslist.org/search/garage-sale?format=rss'

  it('should keep absolute craigslist URLs unchanged', () => {
    const absoluteUrl = 'https://sfbay.craigslist.org/garage-sale/1234567890.html'
    const result = normalizeUrl(absoluteUrl, feedUrl)
    expect(result).toBe(absoluteUrl)
  })

  it('should resolve relative URLs against feed origin', () => {
    const relativeUrl = '/garage-sale/1234567890.html'
    const result = normalizeUrl(relativeUrl, feedUrl)
    expect(result).toBe('https://sfbay.craigslist.org/garage-sale/1234567890.html')
  })

  it('should reject non-craigslist absolute URLs', () => {
    const nonCraigslistUrl = 'https://example.com/garage-sale/123'
    const result = normalizeUrl(nonCraigslistUrl, feedUrl)
    expect(result).toBeNull()
  })

  it('should reject non-craigslist relative URLs', () => {
    const nonCraigslistRelative = '/other-site/garage-sale/123'
    const result = normalizeUrl(nonCraigslistRelative, feedUrl)
    expect(result).toBeNull()
  })

  it('should handle different craigslist subdomains', () => {
    const seattleUrl = 'https://seattle.craigslist.org/garage-sale/123.html'
    const result = normalizeUrl(seattleUrl, feedUrl)
    expect(result).toBe(seattleUrl)
  })

  it('should handle main craigslist.org domain', () => {
    const mainUrl = 'https://craigslist.org/garage-sale/123.html'
    const result = normalizeUrl(mainUrl, feedUrl)
    expect(result).toBe(mainUrl)
  })

  it('should reject invalid URLs', () => {
    const invalidUrl = 'not-a-url'
    const result = normalizeUrl(invalidUrl, feedUrl)
    expect(result).toBeNull()
  })

  it('should handle complex relative paths', () => {
    const complexRelative = '../garage-sale/123.html'
    const result = normalizeUrl(complexRelative, feedUrl)
    expect(result).toBe('https://sfbay.craigslist.org/garage-sale/123.html')
  })

  it('should preserve query parameters and fragments', () => {
    const urlWithParams = 'https://sfbay.craigslist.org/garage-sale/123.html?utm_source=test#section'
    const result = normalizeUrl(urlWithParams, feedUrl)
    expect(result).toBe(urlWithParams)
  })
})
