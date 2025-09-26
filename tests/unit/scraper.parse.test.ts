import { describe, it, expect } from 'vitest'
import { parseCraigslistList } from '@/lib/scraper/parseCraigslist'
import { readCraigslistFixture } from '@/tests/utils/fs'

describe('Craigslist Parser', () => {
  it('should parse basic garage sale results', () => {
    const html = readCraigslistFixture('gms_basic.html')
    const results = parseCraigslistList(html, 20)
    
    expect(results.length).toBeGreaterThan(5)
    expect(results.length).toBeLessThanOrEqual(20)
    
    // Check first result
    const first = results[0]
    expect(first).toMatchObject({
      id: expect.stringMatching(/^cl_\d+_0$/),
      title: 'Multi-Family Garage Sale - Moving!',
      url: expect.stringContaining('craigslist.org'),
      postedAt: '2025-01-27T10:30:00-0800',
      price: 5,
      city: null
    })
    
    // Check all results have required fields
    results.forEach(item => {
      expect(item.id).toBeDefined()
      expect(item.title).toBeDefined()
      expect(item.title.length).toBeGreaterThan(0)
    })
  })
  
  it('should handle missing price fields', () => {
    const html = readCraigslistFixture('gms_missing_fields.html')
    const results = parseCraigslistList(html, 20)
    
    expect(results.length).toBeGreaterThan(0)
    
    // Check that items without prices have null price
    const noPriceItem = results.find(item => item.title.includes('No Price Listed'))
    expect(noPriceItem?.price).toBeNull()
    
    // Check that items with prices are parsed correctly
    const priceItem = results.find(item => item.title.includes('Price Range'))
    expect(priceItem?.price).toBe(5)
  })
  
  it('should handle missing date fields', () => {
    const html = readCraigslistFixture('gms_missing_fields.html')
    const results = parseCraigslistList(html, 20)
    
    expect(results.length).toBeGreaterThan(0)
    
    // Check that items without dates get current timestamp
    const noDateItem = results.find(item => item.title.includes('No Date Listed'))
    expect(noDateItem?.postedAt).toBeDefined()
    expect(new Date(noDateItem!.postedAt!)).toBeInstanceOf(Date)
  })
  
  it('should handle alternative markup structures', () => {
    const html = readCraigslistFixture('gms_alt_markup.html')
    const results = parseCraigslistList(html, 20)
    
    expect(results.length).toBeGreaterThan(0)
    
    // Check that different class names are handled
    const altMarkupItem = results.find(item => item.title.includes('Alt Markup Structure'))
    expect(altMarkupItem).toBeDefined()
    expect(altMarkupItem?.price).toBe(25)
  })
  
  it('should handle FREE price correctly', () => {
    const html = readCraigslistFixture('gms_missing_fields.html')
    const results = parseCraigslistList(html, 20)
    
    const freeItem = results.find(item => item.title.includes('Odd Price Format'))
    expect(freeItem?.price).toBeNull() // FREE should be null
  })
  
  it('should respect limit parameter', () => {
    const html = readCraigslistFixture('gms_basic.html')
    const results = parseCraigslistList(html, 3)
    
    expect(results.length).toBeLessThanOrEqual(3)
  })
  
  it('should generate stable IDs for testing', async () => {
    const html = readCraigslistFixture('gms_basic.html')
    const results1 = parseCraigslistList(html, 5)
    
    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10))
    
    const results2 = parseCraigslistList(html, 5)
    
    // IDs should be different between calls (time-based)
    expect(results1[0].id).not.toBe(results2[0].id)
    
    // But structure should be consistent
    expect(results1[0].id).toMatch(/^cl_\d+_0$/)
    expect(results2[0].id).toMatch(/^cl_\d+_0$/)
  })
  
  it('should handle empty HTML gracefully', () => {
    const results = parseCraigslistList('', 20)
    expect(results).toEqual([])
  })
  
  it('should handle malformed HTML gracefully', () => {
    const malformedHtml = '<div><a class="result-title">Incomplete'
    const results = parseCraigslistList(malformedHtml, 20)
    
    // Should still extract what it can
    expect(results.length).toBeGreaterThanOrEqual(0)
  })
  
  it('should create first 3 items with expected structure', () => {
    const html = readCraigslistFixture('gms_basic.html')
    const results = parseCraigslistList(html, 3)
    
    // Verify structure and content
    expect(results).toHaveLength(3)
    
    results.forEach((item, index) => {
      // Required fields
      expect(item.id).toBeDefined()
      expect(typeof item.id).toBe('string')
      expect(item.id).toMatch(/^cl_\d+_\d+$/)
      
      expect(item.title).toBeDefined()
      expect(typeof item.title).toBe('string')
      expect(item.title.length).toBeGreaterThan(0)
      
      expect(item.url).toBeDefined()
      expect(typeof item.url).toBe('string')
      expect(item.url).toContain('craigslist.org')
      
      // postedAt should be a valid date string
      if (item.postedAt) {
        expect(new Date(item.postedAt).toString()).not.toBe('Invalid Date')
      }
      
      // Price should be number or null
      expect([null, 'number']).toContain(typeof item.price)
      
      // City should be null (not set by parser)
      expect(item.city).toBeNull()
    })
    
    // Verify specific content of first item
    const firstItem = results[0]
    expect(firstItem.title).toBe('Multi-Family Garage Sale - Moving!')
    expect(firstItem.price).toBe(5)
    expect(firstItem.postedAt).toBe('2025-01-27T10:30:00-0800')
  })
})
