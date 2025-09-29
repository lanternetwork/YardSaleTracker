import { describe, it, expect } from 'vitest'
import { 
  getSaleStartZoned, 
  shouldMask, 
  maskCoords, 
  formatRevealTimeRemaining 
} from '@/lib/sales/privacy'

describe('Privacy Masking', () => {
  describe('getSaleStartZoned', () => {
    it('should return correct date for valid sale', () => {
      const sale = {
        date_start: '2024-01-06',
        time_start: '08:00'
      }
      
      const startDate = getSaleStartZoned(sale)
      expect(startDate).toBeInstanceOf(Date)
      expect(startDate?.getFullYear()).toBe(2024)
      expect(startDate?.getMonth()).toBe(0) // January
      expect(startDate?.getDate()).toBe(6)
    })

    it('should return null for missing date', () => {
      const sale = { time_start: '08:00' }
      const startDate = getSaleStartZoned(sale)
      expect(startDate).toBeNull()
    })

    it('should return null for missing time', () => {
      const sale = { date_start: '2024-01-06' }
      const startDate = getSaleStartZoned(sale)
      expect(startDate).toBeNull()
    })
  })

  describe('shouldMask', () => {
    it('should not mask exact privacy mode', () => {
      const sale = {
        privacy_mode: 'exact',
        date_start: '2024-01-06',
        time_start: '08:00'
      }
      
      expect(shouldMask(sale)).toBe(false)
    })

    it('should mask block_until_24h before reveal time', () => {
      const sale = {
        privacy_mode: 'block_until_24h',
        date_start: '2024-01-06',
        time_start: '08:00'
      }
      
      // Set current time to 25 hours before start
      const now = new Date('2024-01-05T07:00:00Z')
      expect(shouldMask(sale, now)).toBe(true)
    })

    it('should not mask block_until_24h after reveal time', () => {
      const sale = {
        privacy_mode: 'block_until_24h',
        date_start: '2024-01-06',
        time_start: '08:00'
      }
      
      // Set current time to 23 hours before start (within 24h)
      const now = new Date('2024-01-05T09:00:00Z')
      expect(shouldMask(sale, now)).toBe(false)
    })

    it('should not mask if missing date/time', () => {
      const sale = {
        privacy_mode: 'block_until_24h'
      }
      
      expect(shouldMask(sale)).toBe(false)
    })
  })

  describe('maskCoords', () => {
    it('should round coordinates to block level', () => {
      const lat = 37.7749295
      const lng = -122.4194155
      
      const masked = maskCoords(lat, lng)
      
      expect(masked.lat).toBe(37.775) // Rounded to 3 decimal places
      expect(masked.lng).toBe(-122.419)
    })

    it('should handle negative coordinates', () => {
      const lat = -37.7749295
      const lng = -122.4194155
      
      const masked = maskCoords(lat, lng)
      
      expect(masked.lat).toBe(-37.775)
      expect(masked.lng).toBe(-122.419)
    })
  })

  describe('formatRevealTimeRemaining', () => {
    it('should format hours and minutes correctly', () => {
      const sale = {
        privacy_mode: 'block_until_24h',
        date_start: '2024-01-06',
        time_start: '08:00'
      }
      
      // Set current time to 2.5 hours before reveal
      const now = new Date('2024-01-05T05:30:00Z')
      const formatted = formatRevealTimeRemaining(sale, now)
      
      expect(formatted).toMatch(/2h 30m/)
    })

    it('should format minutes only for short durations', () => {
      const sale = {
        privacy_mode: 'block_until_24h',
        date_start: '2024-01-06',
        time_start: '08:00'
      }
      
      // Set current time to 30 minutes before reveal
      const now = new Date('2024-01-05T07:30:00Z')
      const formatted = formatRevealTimeRemaining(sale, now)
      
      expect(formatted).toMatch(/30m/)
    })

    it('should return "Revealed" when already revealed', () => {
      const sale = {
        privacy_mode: 'block_until_24h',
        date_start: '2024-01-06',
        time_start: '08:00'
      }
      
      // Set current time to after reveal
      const now = new Date('2024-01-05T09:00:00Z')
      const formatted = formatRevealTimeRemaining(sale, now)
      
      expect(formatted).toBe('Revealed')
    })
  })
})