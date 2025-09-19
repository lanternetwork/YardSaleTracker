import { describe, it, expect } from 'vitest'
import { defaultFilters } from '@/state/filters'

describe('Filter state', () => {
  describe('defaultFilters', () => {
    it('has correct default values', () => {
      expect(defaultFilters).toEqual({
        q: '',
        maxKm: 25,
        tags: []
      })
    })

    it('has empty search query by default', () => {
      expect(defaultFilters.q).toBe('')
    })

    it('has reasonable default distance', () => {
      expect(defaultFilters.maxKm).toBe(25)
    })

    it('has empty tags array by default', () => {
      expect(defaultFilters.tags).toEqual([])
      expect(Array.isArray(defaultFilters.tags)).toBe(true)
    })
  })

  describe('filter object structure', () => {
    it('allows optional properties', () => {
      const customFilter = {
        ...defaultFilters,
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        min: 0,
        max: 100,
        category: 'furniture'
      }

      expect(customFilter.q).toBe('')
      expect(customFilter.maxKm).toBe(25)
      expect(customFilter.tags).toEqual([])
      expect(customFilter.dateFrom).toBe('2024-01-01')
      expect(customFilter.dateTo).toBe('2024-12-31')
      expect(customFilter.min).toBe(0)
      expect(customFilter.max).toBe(100)
      expect(customFilter.category).toBe('furniture')
    })
  })
})
