import { describe, it, expect } from 'vitest'
import { calculateBoundingBox, calculateDistance } from '@/lib/server/geo'

describe('Geo utilities', () => {
  describe('calculateBoundingBox', () => {
    it('should calculate correct bounding box for center of US', () => {
      const centerLat = 39.8283
      const centerLng = -98.5795
      const radiusMi = 25
      
      const bbox = calculateBoundingBox(centerLat, centerLng, radiusMi)
      
      // Check that the bounding box is approximately correct
      expect(bbox.latMin).toBeLessThan(centerLat)
      expect(bbox.latMax).toBeGreaterThan(centerLat)
      expect(bbox.lngMin).toBeLessThan(centerLng)
      expect(bbox.lngMax).toBeGreaterThan(centerLng)
      
      // Check that the delta is approximately correct for 25 miles
      const latDelta = bbox.latMax - bbox.latMin
      const lngDelta = bbox.lngMax - bbox.lngMin
      
      // Should be roughly 50 miles total (25 miles in each direction)
      expect(latDelta).toBeCloseTo(50 / 69, 1) // 50 miles / 69 miles per degree
    })

    it('should handle different latitudes correctly', () => {
      // Test at different latitudes to ensure longitude delta adjusts
      const bbox1 = calculateBoundingBox(0, 0, 25) // Equator
      const bbox2 = calculateBoundingBox(45, 0, 25) // Mid-latitude
      const bbox3 = calculateBoundingBox(80, 0, 25) // High latitude
      
      // Longitude delta should be smaller at higher latitudes
      const lngDelta1 = bbox1.lngMax - bbox1.lngMin
      const lngDelta2 = bbox2.lngMax - bbox2.lngMin
      const lngDelta3 = bbox3.lngMax - bbox3.lngMin
      
      expect(lngDelta1).toBeGreaterThan(lngDelta2)
      expect(lngDelta2).toBeGreaterThan(lngDelta3)
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      // Distance between New York and Los Angeles (approximately 2,500 miles)
      const nyLat = 40.7128
      const nyLng = -74.0060
      const laLat = 34.0522
      const laLng = -118.2437
      
      const distance = calculateDistance(nyLat, nyLng, laLat, laLng)
      
      expect(distance).toBeCloseTo(2500, -2) // Within 100 miles
    })

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060)
      expect(distance).toBeCloseTo(0, 5)
    })

    it('should handle short distances accurately', () => {
      // Distance between two nearby points (should be small)
      const distance = calculateDistance(40.7128, -74.0060, 40.7130, -74.0062)
      expect(distance).toBeLessThan(1) // Less than 1 mile
    })
  })
})
