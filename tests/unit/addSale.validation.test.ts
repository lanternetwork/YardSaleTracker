import { describe, it, expect } from 'vitest'
import { SaleSchema } from '@/lib/zodSchemas'

describe('Add Sale Validation', () => {
  it('should validate minimal valid payload', () => {
    const validPayload = {
      title: 'Neighborhood Garage Sale',
      address: '123 Main St, San Francisco, CA',
      tags: [],
      photos: []
    }

    const result = SaleSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.title).toBe('Neighborhood Garage Sale')
      expect(result.data.address).toBe('123 Main St, San Francisco, CA')
      expect(result.data.tags).toEqual([])
      expect(result.data.photos).toEqual([])
    }
  })

  it('should validate complete payload with all fields', () => {
    const completePayload = {
      title: 'Estate Sale - Antiques & Collectibles',
      description: 'Large estate sale with vintage furniture and collectibles',
      address: '456 Oak Avenue, Berkeley, CA 94705',
      city: 'Berkeley',
      state: 'CA',
      zip: '94705',
      start_at: '2025-02-01T09:00:00Z',
      end_at: '2025-02-01T17:00:00Z',
      // (deprecated; yard sales do not have sale-level prices)
      contact: '555-123-4567',
      lat: 37.8719,
      lng: -122.2585,
      tags: ['antiques', 'furniture', 'collectibles'],
      photos: ['photo1.jpg', 'photo2.jpg']
    }

    const result = SaleSchema.safeParse(completePayload)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.title).toBe('Estate Sale - Antiques & Collectibles')
      expect(result.data.description).toBe('Large estate sale with vintage furniture and collectibles')
      expect(result.data.lat).toBe(37.8719)
      expect(result.data.lng).toBe(-122.2585)
      expect(result.data.tags).toEqual(['antiques', 'furniture', 'collectibles'])
    }
  })

  it('should reject missing required title', () => {
    const invalidPayload = {
      address: '123 Main St, San Francisco, CA',
      tags: [],
      photos: []
    }

    const result = SaleSchema.safeParse(invalidPayload)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.errors).toContainEqual(
        expect.objectContaining({
          path: ['title'],
          message: expect.stringContaining('Required')
        })
      )
    }
  })

  it('should reject title that is too short', () => {
    const invalidPayload = {
      title: 'AB', // Less than 3 characters
      address: '123 Main St, San Francisco, CA',
      tags: [],
      photos: []
    }

    const result = SaleSchema.safeParse(invalidPayload)
    expect(result.success).toBe(false)
    
    if (!result.success) {
      expect(result.error.errors).toContainEqual(
        expect.objectContaining({
          path: ['title'],
          message: expect.stringContaining('at least 3')
        })
      )
    }
  })

  // (deprecated; yard sales do not have sale-level prices)

  it('should handle optional fields correctly', () => {
    const payloadWithOptionals = {
      title: 'Test Sale',
      address: '123 Main St, San Francisco, CA',
      description: undefined,
      city: undefined,
      state: undefined,
      zip: undefined,
      start_at: undefined,
      end_at: undefined,
      price_min: undefined,
      price_max: undefined,
      contact: undefined,
      lat: undefined,
      lng: undefined,
      tags: [],
      photos: []
    }

    const result = SaleSchema.safeParse(payloadWithOptionals)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.description).toBeUndefined()
      expect(result.data.city).toBeUndefined()
      expect(result.data.lat).toBeUndefined()
      expect(result.data.tags).toEqual([])
      expect(result.data.photos).toEqual([])
    }
  })

  it('should validate array fields with proper defaults', () => {
    const payloadWithoutArrays = {
      title: 'Test Sale',
      address: '123 Main St, San Francisco, CA'
    }

    const result = SaleSchema.safeParse(payloadWithoutArrays)
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.tags).toEqual([])
      expect(result.data.photos).toEqual([])
    }
  })

  it('should validate numeric fields correctly', () => {
    const payloadWithNumbers = {
      title: 'Test Sale',
      address: '123 Main St, San Francisco, CA',
      // (deprecated; yard sales do not have sale-level prices)
      lat: 37.7749,
      lng: -122.4194,
      tags: [],
      photos: []
    }

    const result = SaleSchema.safeParse(payloadWithNumbers)
    expect(result.success).toBe(true)
    
    if (result.success) {
      // (deprecated; yard sales do not have sale-level prices)
      expect(result.data.lat).toBe(37.7749)
      expect(result.data.lng).toBe(-122.4194)
    }
  })

  it('should reject invalid numeric values', () => {
    const invalidPayload = {
      title: 'Test Sale',
      address: '123 Main St, San Francisco, CA',
      // (deprecated; yard sales do not have sale-level prices)
      tags: [],
      photos: []
    }

    const result = SaleSchema.safeParse(invalidPayload)
    expect(result.success).toBe(false)
    
    if (!result.success) {
        // (deprecated; yard sales do not have sale-level prices)
    }
  })
})
