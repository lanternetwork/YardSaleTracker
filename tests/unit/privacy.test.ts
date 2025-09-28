import { describe, it, expect, vi } from 'vitest'
import { shouldMask, maskCoords, applyPrivacyMasking, getRevealTimeRemaining, formatRevealTimeRemaining } from '@/lib/sales/privacy'

describe('Privacy Masking', () => {
  describe('shouldMask', () => {
    it('should return false for exact privacy mode', () => {
      const sale = {
        id: '1',
        title: 'Test Sale',
        privacy_mode: 'exact' as const,
        date_start: '2023-12-01',
        time_start: '10:00'
      }
      
      expect(shouldMask(sale)).toBe(false)
    })

    it('should return false when privacy mode is block_until_24h but no date/time', () => {
      const sale = {
        id: '1',
        title: 'Test Sale',
        privacy_mode: 'block_until_24h' as const
      }
      
      expect(shouldMask(sale)).toBe(false)
    })

    it('should return true when privacy mode is block_until_24h and more than 24h before start', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2) // 2 days from now
      
      const sale = {
        id: '1',
        title: 'Test Sale',
        privacy_mode: 'block_until_24h' as const,
        date_start: futureDate.toISOString().split('T')[0],
        time_start: '10:00'
      }
      
      expect(shouldMask(sale)).toBe(true)
    })

    it('should return false when privacy mode is block_until_24h and less than 24h before start', () => {
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 12) // 12 hours from now
      
      const sale = {
        id: '1',
        title: 'Test Sale',
        privacy_mode: 'block_until_24h' as const,
        date_start: futureDate.toISOString().split('T')[0],
        time_start: futureDate.toTimeString().split(' ')[0].substring(0, 5)
      }
      
      expect(shouldMask(sale)).toBe(false)
    })
  })

  describe('maskCoords', () => {
    it('should round coordinates to ~3 decimal places', () => {
      const result = maskCoords(37.7749, -122.4194)
      
      expect(result.lat).toBe(37.775)
      expect(result.lng).toBe(-122.419)
    })

    it('should handle negative coordinates', () => {
      const result = maskCoords(-37.7749, -122.4194)
      
      expect(result.lat).toBe(-37.775)
      expect(result.lng).toBe(-122.419)
    })
  })

  describe('applyPrivacyMasking', () => {
    it('should not mask when shouldMask returns false', () => {
      const sale = {
        id: '1',
        title: 'Test Sale',
        lat: 37.7749,
        lng: -122.4194,
        privacy_mode: 'exact' as const
      }
      
      const result = applyPrivacyMasking(sale)
      
      expect(result.lat).toBe(37.7749)
      expect(result.lng).toBe(-122.4194)
      expect(result.is_masked).toBeUndefined()
    })

    it('should mask when shouldMask returns true', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2)
      
      const sale = {
        id: '1',
        title: 'Test Sale',
        lat: 37.7749,
        lng: -122.4194,
        privacy_mode: 'block_until_24h' as const,
        date_start: futureDate.toISOString().split('T')[0],
        time_start: '10:00'
      }
      
      const result = applyPrivacyMasking(sale)
      
      expect(result.lat).toBe(37.775)
      expect(result.lng).toBe(-122.419)
      expect(result.is_masked).toBe(true)
      expect(result.reveal_time).toBeDefined()
    })
  })

  describe('getRevealTimeRemaining', () => {
    it('should return 0 for exact privacy mode', () => {
      const sale = {
        id: '1',
        title: 'Test Sale',
        privacy_mode: 'exact' as const
      }
      
      expect(getRevealTimeRemaining(sale)).toBe(0)
    })

    it('should return 0 when no date/time provided', () => {
      const sale = {
        id: '1',
        title: 'Test Sale',
        privacy_mode: 'block_until_24h' as const
      }
      
      expect(getRevealTimeRemaining(sale)).toBe(0)
    })

    it('should return correct time remaining', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 2)
      
      const sale = {
        id: '1',
        title: 'Test Sale',
        privacy_mode: 'block_until_24h' as const,
        date_start: futureDate.toISOString().split('T')[0],
        time_start: '10:00'
      }
      
      const remaining = getRevealTimeRemaining(sale)
      expect(remaining).toBeGreaterThan(0)
      expect(remaining).toBeLessThan(2 * 24 * 60 * 60 * 1000) // Less than 2 days
    })
  })

  describe('formatRevealTimeRemaining', () => {
    it('should return "Revealed" when time remaining is 0', () => {
      const sale = {
        id: '1',
        title: 'Test Sale',
        privacy_mode: 'exact' as const
      }
      
      expect(formatRevealTimeRemaining(sale)).toBe('Revealed')
    })

    it('should format hours and minutes correctly', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      futureDate.setHours(futureDate.getHours() + 2)
      
      const sale = {
        id: '1',
        title: 'Test Sale',
        privacy_mode: 'block_until_24h' as const,
        date_start: futureDate.toISOString().split('T')[0],
        time_start: '10:00'
      }
      
      const result = formatRevealTimeRemaining(sale)
      expect(result).toMatch(/\d+h \d+m/)
    })
  })
})