import { describe, it, expect, vi } from 'vitest'
import { nextStatus } from '@/lib/sales/staleness'

describe('nextStatus', () => {
  it('returns active for recent', () => {
    const now = Date.now()
    const iso = new Date(now - 3600 * 1000).toISOString()
    expect(nextStatus(iso)).toBe('active')
  })
  it('returns stale for >72h', () => {
    const now = Date.now()
    const iso = new Date(now - 73 * 3600 * 1000).toISOString()
    expect(nextStatus(iso)).toBe('stale')
  })
  it('returns removed for >7d', () => {
    const now = Date.now()
    const iso = new Date(now - 8 * 24 * 3600 * 1000).toISOString()
    expect(nextStatus(iso)).toBe('removed')
  })
})


