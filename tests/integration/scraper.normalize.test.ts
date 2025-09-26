import { describe, it, expect } from 'vitest'
import { normalizeCraigslistItem, validateNormalizedSale } from '@/lib/scraper/normalizeCraigslist'
import { parseCraigslistList } from '@/lib/scraper/parseCraigslist'
import { readCraigslistFixture } from '@/tests/utils/fs'

describe('Craigslist Normalization', () => {
  it('should normalize basic parsed items correctly', () => {
    const html = readCraigslistFixture('gms_basic.html')
    const parsedItems = parseCraigslistList(html, 5)
    
    const normalized = parsedItems.map(item => normalizeCraigslistItem(item, 'sfbay'))
    
    expect(normalized.length).toBeGreaterThan(0)
    
    // Check first item
    const first = normalized[0]
    expect(first).toMatchObject({
      title: expect.any(String),
      description: 'Found on Craigslist sfbay',
      source: 'craigslist',
      tags: expect.arrayContaining(['craigslist']),
      photos: []
    })
    
    // Check that all items have required fields
    normalized.forEach(sale => {
      expect(sale.title).toBeDefined()
      expect(sale.source).toBe('craigslist')
      expect(sale.tags).toContain('craigslist')
      expect(Array.isArray(sale.tags)).toBe(true)
      expect(Array.isArray(sale.photos)).toBe(true)
    })
  })
  
  it('should extract tags from titles correctly', () => {
    const testCases = [
      { title: 'Multi-Family Garage Sale - Moving!', expectedTags: ['multi-family', 'garage', 'moving', 'craigslist'] },
      { title: 'Estate Sale - Antique Furniture & Tools', expectedTags: ['estate', 'antique', 'furniture', 'tools', 'craigslist'] },
      { title: 'Yard Sale - Kids Toys & Books', expectedTags: ['yard', 'kids', 'toys', 'books', 'craigslist'] },
      { title: 'Garage Sale - Electronics & Appliances', expectedTags: ['garage', 'electronics', 'appliances', 'craigslist'] },
      { title: 'Moving Sale - Clothing & Accessories', expectedTags: ['moving', 'clothing', 'accessories', 'craigslist'] },
      { title: 'Estate Sale - Collectibles & Art', expectedTags: ['estate', 'collectibles', 'art', 'craigslist'] }
    ]
    
    testCases.forEach(({ title, expectedTags }) => {
      const parsedItem = {
        id: 'test',
        title,
        url: 'http://test.com',
        postedAt: '2025-01-27T10:30:00-0800',
        price: 25,
        city: null
      }
      
      const normalized = normalizeCraigslistItem(parsedItem)
      
      expectedTags.forEach(tag => {
        expect(normalized.tags).toContain(tag)
      })
    })
  })
  
  it('should handle missing fields gracefully', () => {
    const html = readCraigslistFixture('gms_missing_fields.html')
    const parsedItems = parseCraigslistList(html, 5)
    
    const normalized = parsedItems.map(item => normalizeCraigslistItem(item, 'sfbay'))
    
    // Check items without prices
    const noPriceItem = normalized.find(sale => sale.title.includes('No Price Listed'))
    expect(noPriceItem?.price_min).toBeUndefined()
    expect(noPriceItem?.price_max).toBeUndefined()
    
    // Check items with prices
    const priceItem = normalized.find(sale => sale.title.includes('Price Range'))
    expect(priceItem?.price_min).toBe(5)
    expect(priceItem?.price_max).toBe(5)
  })
  
  it('should handle alternative markup structures', () => {
    const html = readCraigslistFixture('gms_alt_markup.html')
    const parsedItems = parseCraigslistList(html, 5)
    
    const normalized = parsedItems.map(item => normalizeCraigslistItem(item, 'sfbay'))
    
    expect(normalized.length).toBeGreaterThan(0)
    
    // All items should have required fields
    normalized.forEach(sale => {
      expect(sale.title).toBeDefined()
      expect(sale.source).toBe('craigslist')
      expect(sale.tags).toContain('craigslist')
    })
  })
  
  it('should validate against SaleSchema', () => {
    const html = readCraigslistFixture('gms_basic.html')
    const parsedItems = parseCraigslistList(html, 3)
    
    const normalized = parsedItems.map(item => normalizeCraigslistItem(item, 'sfbay'))
    
    normalized.forEach(sale => {
      const validation = validateNormalizedSale(sale)
      expect(validation.valid).toBe(true)
      expect(validation.errors).toEqual([])
    })
  })
  
  it('should not include undefined/null fields in output', () => {
    const parsedItem = {
      id: 'test',
      title: 'Test Sale',
      url: 'http://test.com',
      postedAt: '2025-01-27T10:30:00-0800',
      price: null, // No price
      city: null
    }
    
    const normalized = normalizeCraigslistItem(parsedItem)
    
    // Should not have price fields
    expect(normalized.price_min).toBeUndefined()
    expect(normalized.price_max).toBeUndefined()
    
    // Should have required fields
    expect(normalized.title).toBe('Test Sale')
    expect(normalized.source).toBe('craigslist')
    expect(normalized.tags).toContain('craigslist')
  })
  
  it('should handle empty arrays correctly', () => {
    const parsedItem = {
      id: 'test',
      title: 'Test Sale',
      url: 'http://test.com',
      postedAt: '2025-01-27T10:30:00-0800',
      price: 25,
      city: null
    }
    
    const normalized = normalizeCraigslistItem(parsedItem)
    
    // Empty arrays should be included
    expect(normalized.tags).toEqual(['craigslist'])
    expect(normalized.photos).toEqual([])
  })
  
  it('should create normalized items with expected structure', () => {
    const html = readCraigslistFixture('gms_basic.html')
    const parsedItems = parseCraigslistList(html, 3)
    
    const normalized = parsedItems.map(item => normalizeCraigslistItem(item, 'sfbay'))
    
    // Verify structure and content
    expect(normalized).toHaveLength(3)
    
    normalized.forEach(item => {
      // Required fields
      expect(item.title).toBeDefined()
      expect(typeof item.title).toBe('string')
      expect(item.title.length).toBeGreaterThan(0)
      
      expect(item.description).toBe('Found on Craigslist sfbay')
      expect(item.source).toBe('craigslist')
      expect(Array.isArray(item.tags)).toBe(true)
      expect(item.tags).toContain('craigslist')
      expect(Array.isArray(item.photos)).toBe(true)
      expect(item.photos).toEqual([])
      
      // start_at should be a valid date string
      if (item.start_at) {
        expect(new Date(item.start_at).toString()).not.toBe('Invalid Date')
      }
      
      // Price fields should be numbers if present
      if (item.price_min !== undefined) {
        expect(typeof item.price_min).toBe('number')
      }
      if (item.price_max !== undefined) {
        expect(typeof item.price_max).toBe('number')
      }
    })
    
    // Verify first item has expected content
    const firstItem = normalized[0]
    expect(firstItem.title).toBe('Multi-Family Garage Sale - Moving!')
    expect(firstItem.price_min).toBe(5)
    expect(firstItem.price_max).toBe(5)
    expect(firstItem.tags).toContain('multi-family')
    expect(firstItem.tags).toContain('moving')
    expect(firstItem.tags).toContain('garage')
  })
})
