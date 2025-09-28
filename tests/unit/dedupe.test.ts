import { describe, it, expect, vi } from 'vitest'
import { calculateDistance, dateRangesOverlap } from '@/lib/sales/dedupe-utils'

describe('Deduplication', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Distance between San Francisco and Oakland (approximately 12.5 km)
      const sf = { lat: 37.7749, lng: -122.4194 }
      const oakland = { lat: 37.8044, lng: -122.2712 }
      
      const distance = calculateDistance(sf.lat, sf.lng, oakland.lat, oakland.lng)
      
      // Should be approximately 12.5 km (12500 meters)
      expect(distance).toBeCloseTo(12500, -2) // Within 100 meters
    })

    it('should return 0 for identical coordinates', () => {
      const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194)
      expect(distance).toBe(0)
    })

    it('should handle negative coordinates', () => {
      const distance = calculateDistance(-37.7749, -122.4194, -37.8044, -122.2712)
      expect(distance).toBeGreaterThan(0)
    })
  })

  describe('dateRangesOverlap', () => {
    it('should return true for overlapping date ranges', () => {
      expect(dateRangesOverlap('2023-12-01', '2023-12-03', '2023-12-02', '2023-12-04')).toBe(true)
    })

    it('should return true for identical date ranges', () => {
      expect(dateRangesOverlap('2023-12-01', '2023-12-03', '2023-12-01', '2023-12-03')).toBe(true)
    })

    it('should return true when one range contains the other', () => {
      expect(dateRangesOverlap('2023-12-01', '2023-12-05', '2023-12-02', '2023-12-03')).toBe(true)
    })

    it('should return false for non-overlapping ranges', () => {
      expect(dateRangesOverlap('2023-12-01', '2023-12-02', '2023-12-03', '2023-12-04')).toBe(false)
    })

    it('should return true for ranges that touch at the boundary', () => {
      expect(dateRangesOverlap('2023-12-01', '2023-12-02', '2023-12-02', '2023-12-03')).toBe(true)
    })

    it('should handle single-day events (no end date)', () => {
      expect(dateRangesOverlap('2023-12-01', undefined, '2023-12-01', undefined)).toBe(true)
      expect(dateRangesOverlap('2023-12-01', undefined, '2023-12-02', undefined)).toBe(false)
    })

    it('should handle mixed single-day and multi-day events', () => {
      expect(dateRangesOverlap('2023-12-01', '2023-12-03', '2023-12-02', undefined)).toBe(true)
      expect(dateRangesOverlap('2023-12-01', undefined, '2023-12-01', '2023-12-03')).toBe(true)
    })
  })
})