import { describe, it, expect } from 'vitest'
import { getWeekendRange } from '@/lib/privacy'

describe('Weekend Picker', () => {
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

  it('should return next weekend for weekday', () => {
    const monday = new Date('2024-01-01') // Monday
    const range = getWeekendRange(monday)
    
    expect(range.start.getDay()).toBe(5) // Friday
    expect(range.end.getDay()).toBe(0) // Sunday
  })

  it('should return weekend for Tuesday', () => {
    const tuesday = new Date('2024-01-02') // Tuesday
    const range = getWeekendRange(tuesday)
    
    expect(range.start.getDay()).toBe(5) // Friday
    expect(range.end.getDay()).toBe(0) // Sunday
  })

  it('should return weekend for Wednesday', () => {
    const wednesday = new Date('2024-01-03') // Wednesday
    const range = getWeekendRange(wednesday)
    
    expect(range.start.getDay()).toBe(5) // Friday
    expect(range.end.getDay()).toBe(0) // Sunday
  })

  it('should return weekend for Thursday', () => {
    const thursday = new Date('2024-01-04') // Thursday
    const range = getWeekendRange(thursday)
    
    expect(range.start.getDay()).toBe(5) // Friday
    expect(range.end.getDay()).toBe(0) // Sunday
  })
})
