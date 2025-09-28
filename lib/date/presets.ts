/**
 * Time presets for yard sale wizard
 * Provides common date/time combinations for quick selection
 */

export interface TimePreset {
  id: string
  label: string
  description: string
  date_start: string
  date_end?: string
  time_start: string
  time_end: string
}

/**
 * Get the next upcoming Saturday date
 */
export function getUpcomingSaturday(timezone: string = 'America/Los_Angeles'): Date {
  const now = new Date()
  const today = new Date(now.toLocaleDateString('en-CA', { timeZone: timezone }))
  
  // Find next Saturday (day 6)
  const daysUntilSaturday = (6 - today.getDay() + 7) % 7
  const nextSaturday = new Date(today)
  nextSaturday.setDate(today.getDate() + (daysUntilSaturday === 0 ? 7 : daysUntilSaturday))
  
  return nextSaturday
}

/**
 * Get the next upcoming Sunday date
 */
export function getUpcomingSunday(timezone: string = 'America/Los_Angeles'): Date {
  const now = new Date()
  const today = new Date(now.toLocaleDateString('en-CA', { timeZone: timezone }))
  
  // Find next Sunday (day 0)
  const daysUntilSunday = (7 - today.getDay()) % 7
  const nextSunday = new Date(today)
  nextSunday.setDate(today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday))
  
  return nextSunday
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Get all available time presets
 */
export function getTimePresets(timezone: string = 'America/Los_Angeles'): TimePreset[] {
  const nextSaturday = getUpcomingSaturday(timezone)
  const nextSunday = getUpcomingSunday(timezone)
  
  return [
    {
      id: 'saturday',
      label: 'This Saturday 8–2',
      description: 'Saturday 8:00 AM – 2:00 PM',
      date_start: formatDate(nextSaturday),
      time_start: '08:00',
      time_end: '14:00'
    },
    {
      id: 'sunday',
      label: 'This Sunday 9–1',
      description: 'Sunday 9:00 AM – 1:00 PM',
      date_start: formatDate(nextSunday),
      time_start: '09:00',
      time_end: '13:00'
    },
    {
      id: 'weekend',
      label: 'Sat + Sun 8–2',
      description: 'Saturday & Sunday 8:00 AM – 2:00 PM',
      date_start: formatDate(nextSaturday),
      date_end: formatDate(nextSunday),
      time_start: '08:00',
      time_end: '14:00'
    },
    {
      id: 'custom',
      label: 'Custom',
      description: 'Choose your own dates and times',
      date_start: '',
      time_start: '',
      time_end: ''
    }
  ]
}

/**
 * Get human-readable summary of a time preset
 */
export function getTimePresetSummary(preset: TimePreset): string {
  if (preset.id === 'custom') {
    return 'Custom dates and times'
  }
  
  if (preset.date_end && preset.date_start !== preset.date_end) {
    // Multi-day
    const startDate = new Date(preset.date_start)
    const endDate = new Date(preset.date_end)
    const startDay = startDate.toLocaleDateString('en-US', { weekday: 'short' })
    const endDay = endDate.toLocaleDateString('en-US', { weekday: 'short' })
    return `${startDay}–${endDay} ${preset.time_start}–${preset.time_end}`
  } else {
    // Single day
    const date = new Date(preset.date_start)
    const day = date.toLocaleDateString('en-US', { weekday: 'short' })
    return `${day} ${preset.time_start}–${preset.time_end}`
  }
}

/**
 * Validate time preset data
 */
export function validateTimePreset(data: Partial<TimePreset>): string[] {
  const errors: string[] = []
  
  if (!data.date_start) {
    errors.push('Start date is required')
  }
  
  if (!data.time_start) {
    errors.push('Start time is required')
  }
  
  if (!data.time_end) {
    errors.push('End time is required')
  }
  
  if (data.date_start && data.date_end && data.date_start > data.date_end) {
    errors.push('End date must be after start date')
  }
  
  if (data.time_start && data.time_end && data.time_start >= data.time_end) {
    errors.push('End time must be after start time')
  }
  
  if (data.date_start && data.date_end) {
    const startDate = new Date(data.date_start)
    const endDate = new Date(data.date_end)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff > 3) {
      errors.push('Sale cannot span more than 3 days')
    }
  }
  
  return errors
}
