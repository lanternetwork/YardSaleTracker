import { describe, it, expect } from 'vitest'
import { maskLocation, getRevealCountdown, shouldAutoHide, getWeekendRange } from '@/lib/privacy'

describe('Privacy Masking', () => {
  it('should return exact location for exact privacy mode', () => {
    const sale = {
      lat: 37.7749,
      lng: -122.4194,
      address: '123 Main St, San Francisco, CA',
      privacy_mode: 'exact' as const,
      date_start: '2024-01-15',
      time_start: '09:00'
    }

    const result = maskLocation(sale)
    
    expect(result.lat).toBe(37.7749)
    expect(result.lng).toBe(-122.4194)
    expect(result.address).toBe('123 Main St, San Francisco, CA')
    expect(result.is_masked).toBe(false)
  })

  it('should mask location for block_until_24h mode before reveal time', () => {
    const sale = {
      lat: 37.7749,
      lng: -122.4194,
      address: '123 Main St, San Francisco, CA',
      privacy_mode: 'block_until_24h' as const,
      date_start: '2024-12-31',
      time_start: '09:00'
    }

    const result = maskLocation(sale)
    
    expect(result.lat).not.toBe(37.7749)
    expect(result.lng).not.toBe(-122.4194)
    expect(result.address).not.toBe('123 Main St, San Francisco, CA')
    expect(result.is_masked).toBe(true)
    expect(result.reveal_time).toBeDefined()
  })

  it('should reveal location for block_until_24h mode after reveal time', () => {
    const sale = {
      lat: 37.7749,
      lng: -122.4194,
      address: '123 Main St, San Francisco, CA',
      privacy_mode: 'block_until_24h' as const,
      date_start: '2024-01-01',
      time_start: '09:00'
    }

    const result = maskLocation(sale)
    
    expect(result.lat).toBe(37.7749)
    expect(result.lng).toBe(-122.4194)
    expect(result.address).toBe('123 Main St, San Francisco, CA')
    expect(result.is_masked).toBe(false)
  })
})

describe('Reveal Countdown', () => {
  it('should return correct countdown format', () => {
    const futureTime = new Date()
    futureTime.setHours(futureTime.getHours() + 2)
    
    const countdown = getRevealCountdown(futureTime.toISOString())
    expect(countdown).toMatch(/Reveals in \d+h \d+m/)
  })

  it('should return "Revealed" for past time', () => {
    const pastTime = new Date()
    pastTime.setHours(pastTime.getHours() - 1)
    
    const countdown = getRevealCountdown(pastTime.toISOString())
    expect(countdown).toBe('Revealed')
  })
})

describe('Auto Hide', () => {
  it('should hide sales older than 7 days', () => {
    const oldSale = {
      date_start: '2024-01-01',
      date_end: '2024-01-01'
    }
    
    expect(shouldAutoHide(oldSale)).toBe(true)
  })

  it('should not hide recent sales', () => {
    const recentSale = {
      date_start: new Date().toISOString().split('T')[0],
      date_end: new Date().toISOString().split('T')[0]
    }
    
    expect(shouldAutoHide(recentSale)).toBe(false)
  })
})

describe('Weekend Range', () => {
  it('should return correct weekend range for Friday', () => {
    const friday = new Date('2024-01-05') // Friday
    const range = getWeekendRange(friday)
    
    expect(range.start.getDay()).toBe(5) // Friday
    expect(range.end.getDay()).toBe(0) // Sunday
  })

  it('should return correct weekend range for Saturday', () => {
    const saturday = new Date('2024-01-06') // Saturday
    const range = getWeekendRange(saturday)
    
    expect(range.start.getDay()).toBe(5) // Friday
    expect(range.end.getDay()).toBe(0) // Sunday
  })

  it('should return correct weekend range for Sunday', () => {
    const sunday = new Date('2024-01-07') // Sunday
    const range = getWeekendRange(sunday)
    
    expect(range.start.getDay()).toBe(5) // Friday
    expect(range.end.getDay()).toBe(0) // Sunday
  })
})
