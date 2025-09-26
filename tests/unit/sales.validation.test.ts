import { z } from 'zod'

const createSaleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  address: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(2).max(2),
  zip: z.string().min(5).max(10),
  lat: z.number().optional(),
  lng: z.number().optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
  contact: z.string().max(100).optional(),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(['draft', 'published']).default('published')
})

const updateSaleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(2).max(2).optional(),
  zip: z.string().min(5).max(10).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
  contact: z.string().max(100).optional(),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional()
})

describe('Sales Schema Validation', () => {
  describe('createSaleSchema', () => {
    it('should validate a complete sale object', () => {
      const validSale = {
        title: 'Test Sale',
        description: 'A test sale',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        lat: 37.7749,
        lng: -122.4194,
        start_at: '2024-01-01T09:00:00Z',
        end_at: '2024-01-01T17:00:00Z',
        price_min: 0,
        price_max: 100,
        contact: 'test@example.com',
        tags: ['furniture', 'clothing'],
        status: 'published' as const
      }

      expect(() => createSaleSchema.parse(validSale)).not.toThrow()
    })

    it('should validate minimal sale object', () => {
      const minimalSale = {
        title: 'Test Sale',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
      }

      expect(() => createSaleSchema.parse(minimalSale)).not.toThrow()
    })

    it('should reject empty title', () => {
      const invalidSale = {
        title: '',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
      }

      expect(() => createSaleSchema.parse(invalidSale)).toThrow()
    })

    it('should reject title too long', () => {
      const invalidSale = {
        title: 'a'.repeat(201),
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
      }

      expect(() => createSaleSchema.parse(invalidSale)).toThrow()
    })

    it('should reject invalid state', () => {
      const invalidSale = {
        title: 'Test Sale',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CALIFORNIA', // Too long
        zip: '12345'
      }

      expect(() => createSaleSchema.parse(invalidSale)).toThrow()
    })

    it('should reject invalid price range', () => {
      const invalidSale = {
        title: 'Test Sale',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        price_min: -10 // Negative price
      }

      expect(() => createSaleSchema.parse(invalidSale)).toThrow()
    })

    it('should reject too many tags', () => {
      const invalidSale = {
        title: 'Test Sale',
        address: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        tags: Array(11).fill('tag') // Too many tags
      }

      expect(() => createSaleSchema.parse(invalidSale)).toThrow()
    })
  })

  describe('updateSaleSchema', () => {
    it('should validate partial update', () => {
      const partialUpdate = {
        title: 'Updated Sale',
        status: 'archived' as const
      }

      expect(() => updateSaleSchema.parse(partialUpdate)).not.toThrow()
    })

    it('should validate empty update', () => {
      expect(() => updateSaleSchema.parse({})).not.toThrow()
    })

    it('should reject invalid status', () => {
      const invalidUpdate = {
        status: 'invalid' as any
      }

      expect(() => updateSaleSchema.parse(invalidUpdate)).toThrow()
    })
  })
})
