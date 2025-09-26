import { describe, it, expect } from 'vitest'
import { findDuplicates, hasDateOverlap, calculateDistance, calculateSimilarity } from '@/lib/dedupe'

describe('Dedupe Functionality', () => {
  const mockSale = {
    id: 'sale-1',
    title: 'Vintage Furniture Sale',
    address: '123 Main St, City, State',
    lat: 37.7749,
    lng: -122.4194,
    date_start: '2024-12-28',
    date_end: '2024-12-29'
  }

  const mockCandidates = [
    {
      id: 'sale-2',
      title: 'Vintage Furniture & Antiques',
      address: '125 Main St, City, State',
      lat: 37.7750,
      lng: -122.4195,
      date_start: '2024-12-28',
      date_end: '2024-12-29'
    },
    {
      id: 'sale-3',
      title: 'Electronics Sale',
      address: '456 Oak Ave, City, State',
      lat: 37.7849,
      lng: -122.4294,
      date_start: '2024-12-28',
      date_end: '2024-12-29'
    },
    {
      id: 'sale-4',
      title: 'Furniture & Home Decor',
      address: '127 Main St, City, State',
      lat: 37.7751,
      lng: -122.4196,
      date_start: '2024-12-30',
      date_end: '2024-12-31'
    }
  ]

  it('should find duplicates based on distance and similarity', async () => {
    const duplicates = await findDuplicates(mockSale, mockCandidates)
    
    expect(duplicates).toHaveLength(1)
    expect(duplicates[0].id).toBe('sale-2')
    expect(duplicates[0].similarity).toBeGreaterThan(0.3)
    expect(duplicates[0].distance).toBeLessThan(150)
  })

  it('should not find duplicates for different dates', async () => {
    const saleWithDifferentDate = {
      ...mockSale,
      date_start: '2024-12-30',
      date_end: '2024-12-31'
    }
    
    const duplicates = await findDuplicates(saleWithDifferentDate, mockCandidates)
    expect(duplicates).toHaveLength(0)
  })

  it('should not find duplicates for distant locations', async () => {
    const distantSale = {
      ...mockSale,
      lat: 37.8849,
      lng: -122.5294
    }
    
    const duplicates = await findDuplicates(distantSale, mockCandidates)
    expect(duplicates).toHaveLength(0)
  })
})

describe('Date Overlap', () => {
  it('should detect overlapping dates', () => {
    const sale1 = { date_start: '2024-12-28', date_end: '2024-12-29' }
    const sale2 = { date_start: '2024-12-28', date_end: '2024-12-29' }
    
    expect(hasDateOverlap(sale1, sale2)).toBe(true)
  })

  it('should detect partial overlap', () => {
    const sale1 = { date_start: '2024-12-28', date_end: '2024-12-29' }
    const sale2 = { date_start: '2024-12-29', date_end: '2024-12-30' }
    
    expect(hasDateOverlap(sale1, sale2)).toBe(true)
  })

  it('should not detect non-overlapping dates', () => {
    const sale1 = { date_start: '2024-12-28', date_end: '2024-12-29' }
    const sale2 = { date_start: '2024-12-30', date_end: '2024-12-31' }
    
    expect(hasDateOverlap(sale1, sale2)).toBe(false)
  })
})

describe('Distance Calculation', () => {
  it('should calculate distance between two points', () => {
    const distance = calculateDistance(37.7749, -122.4194, 37.7750, -122.4195)
    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(100) // Should be very close
  })

  it('should return 0 for identical points', () => {
    const distance = calculateDistance(37.7749, -122.4194, 37.7749, -122.4194)
    expect(distance).toBe(0)
  })
})

describe('Similarity Calculation', () => {
  it('should return 1 for identical strings', () => {
    const similarity = calculateSimilarity('Vintage Furniture Sale', 'Vintage Furniture Sale')
    expect(similarity).toBe(1)
  })

  it('should return high similarity for similar strings', () => {
    const similarity = calculateSimilarity('Vintage Furniture Sale', 'Vintage Furniture & Antiques')
    expect(similarity).toBeGreaterThan(0.3)
  })

  it('should return low similarity for different strings', () => {
    const similarity = calculateSimilarity('Vintage Furniture Sale', 'Electronics Sale')
    expect(similarity).toBeLessThan(0.3)
  })

  it('should handle empty strings', () => {
    const similarity = calculateSimilarity('', '')
    expect(similarity).toBe(0)
  })
})
