import { describe, it, expect } from 'vitest'
import { 
  getUpcomingSaturday, 
  getUpcomingSunday, 
  getTimePresets, 
  getTimePresetSummary,
  validateTimePreset 
} from '@/lib/date/presets'

describe('Time Presets', () => {
  describe('getUpcomingSaturday', () => {
    it('should return next Saturday', () => {
      const saturday = getUpcomingSaturday()
      expect(saturday.getDay()).toBe(6) // Saturday
      expect(saturday.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('getUpcomingSunday', () => {
    it('should return next Sunday', () => {
      const sunday = getUpcomingSunday()
      expect(sunday.getDay()).toBe(0) // Sunday
      expect(sunday.getTime()).toBeGreaterThan(Date.now())
    })
  })

  describe('getTimePresets', () => {
    it('should return all presets', () => {
      const presets = getTimePresets()
      expect(presets).toHaveLength(4)
      expect(presets.map(p => p.id)).toEqual(['saturday', 'sunday', 'weekend', 'custom'])
    })

    it('should have correct labels', () => {
      const presets = getTimePresets()
      expect(presets[0].label).toBe('This Saturday 8–2')
      expect(presets[1].label).toBe('This Sunday 9–1')
      expect(presets[2].label).toBe('Sat + Sun 8–2')
      expect(presets[3].label).toBe('Custom')
    })
  })

  describe('getTimePresetSummary', () => {
    it('should format single day correctly', () => {
      const preset = {
        id: 'saturday',
        label: 'This Saturday 8–2',
        description: 'Saturday 8:00 AM – 2:00 PM',
        date_start: '2024-01-06',
        time_start: '08:00',
        time_end: '14:00'
      }
      const summary = getTimePresetSummary(preset)
      expect(summary).toContain('Sat')
      expect(summary).toContain('08:00–14:00')
    })

    it('should format multi-day correctly', () => {
      const preset = {
        id: 'weekend',
        label: 'Sat + Sun 8–2',
        description: 'Saturday & Sunday 8:00 AM – 2:00 PM',
        date_start: '2024-01-06',
        date_end: '2024-01-07',
        time_start: '08:00',
        time_end: '14:00'
      }
      const summary = getTimePresetSummary(preset)
      expect(summary).toContain('Sat–Sun')
      expect(summary).toContain('08:00–14:00')
    })
  })

  describe('validateTimePreset', () => {
    it('should validate required fields', () => {
      const errors = validateTimePreset({})
      expect(errors).toContain('Start date is required')
      expect(errors).toContain('Start time is required')
      expect(errors).toContain('End time is required')
    })

    it('should validate date order', () => {
      const errors = validateTimePreset({
        date_start: '2024-01-07',
        date_end: '2024-01-06',
        time_start: '08:00',
        time_end: '14:00'
      })
      expect(errors).toContain('End date must be after start date')
    })

    it('should validate time order', () => {
      const errors = validateTimePreset({
        date_start: '2024-01-06',
        time_start: '14:00',
        time_end: '08:00'
      })
      expect(errors).toContain('End time must be after start time')
    })

    it('should validate max duration', () => {
      const errors = validateTimePreset({
        date_start: '2024-01-06',
        date_end: '2024-01-10', // 4 days
        time_start: '08:00',
        time_end: '14:00'
      })
      expect(errors).toContain('Sale cannot span more than 3 days')
    })

    it('should pass valid preset', () => {
      const errors = validateTimePreset({
        date_start: '2024-01-06',
        date_end: '2024-01-07',
        time_start: '08:00',
        time_end: '14:00'
      })
      expect(errors).toHaveLength(0)
    })
  })
})
