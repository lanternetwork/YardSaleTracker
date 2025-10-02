import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getWeekendWindow, getNextWeekendWindow } from '@/lib/date/dateWindows'

describe('Date Window Helpers', () => {
  beforeEach(() => {
    // Mock current date to a known day for consistent testing
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getWeekendWindow', () => {
    it('should return this weekend for Monday', () => {
      // Monday, October 7, 2024
      vi.setSystemTime(new Date('2024-10-07T12:00:00Z'))
      
      const window = getWeekendWindow()
      const saturday = new Date('2024-10-12T00:00:00Z')
      const sunday = new Date('2024-10-13T23:59:59Z')
      
      expect(window.start.getTime()).toBe(saturday.getTime())
      expect(window.end.getTime()).toBe(sunday.getTime())
      expect(window.label).toBe('This Weekend')
    })

    it('should return this weekend for Friday', () => {
      // Friday, October 11, 2024
      vi.setSystemTime(new Date('2024-10-11T12:00:00Z'))
      
      const window = getWeekendWindow()
      const saturday = new Date('2024-10-12T00:00:00Z')
      const sunday = new Date('2024-10-13T23:59:59Z')
      
      expect(window.start.getTime()).toBe(saturday.getTime())
      expect(window.end.getTime()).toBe(sunday.getTime())
    })

    it('should return next weekend for Saturday', () => {
      // Saturday, October 12, 2024
      vi.setSystemTime(new Date('2024-10-12T12:00:00Z'))
      
      const window = getWeekendWindow()
      const saturday = new Date('2024-10-12T00:00:00Z')
      const sunday = new Date('2024-10-13T23:59:59Z')
      
      expect(window.start.getTime()).toBe(saturday.getTime())
      expect(window.end.getTime()).toBe(sunday.getTime())
    })
  })

  describe('getNextWeekendWindow', () => {
    it('should return next weekend for Monday', () => {
      // Monday, October 7, 2024
      vi.setSystemTime(new Date('2024-10-07T12:00:00Z'))
      
      const window = getNextWeekendWindow()
      const nextSaturday = new Date('2024-10-19T00:00:00Z')
      const nextSunday = new Date('2024-10-20T23:59:59Z')
      
      expect(window.start.getTime()).toBe(nextSaturday.getTime())
      expect(window.end.getTime()).toBe(nextSunday.getTime())
      expect(window.label).toBe('Next Weekend')
    })

    it('should return next weekend for Friday', () => {
      // Friday, October 11, 2024
      vi.setSystemTime(new Date('2024-10-11T12:00:00Z'))
      
      const window = getNextWeekendWindow()
      const nextSaturday = new Date('2024-10-19T00:00:00Z')
      const nextSunday = new Date('2024-10-20T23:59:59Z')
      
      expect(window.start.getTime()).toBe(nextSaturday.getTime())
      expect(window.end.getTime()).toBe(nextSunday.getTime())
    })

    it('should return next weekend for Saturday', () => {
      // Saturday, October 12, 2024
      vi.setSystemTime(new Date('2024-10-12T12:00:00Z'))
      
      const window = getNextWeekendWindow()
      const nextSaturday = new Date('2024-10-19T00:00:00Z')
      const nextSunday = new Date('2024-10-20T23:59:59Z')
      
      expect(window.start.getTime()).toBe(nextSaturday.getTime())
      expect(window.end.getTime()).toBe(nextSunday.getTime())
    })
  })
})
