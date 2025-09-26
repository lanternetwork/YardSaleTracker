import { describe, it, expect } from 'vitest'
import { coerceNearbyParams } from '@/lib/nearby/validation'

describe('coerceNearbyParams', () => {
  it('requires lat/lng', () => {
    expect(coerceNearbyParams({ lat: '', lng: '' })).toEqual({ ok: false, error: 'lat and lng are required' })
  })
  it('coerces allowed radius and caps limit', () => {
    const r = coerceNearbyParams({ lat: '1', lng: '2', radius_miles: '10', limit: '999' }) as any
    expect(r.ok).toBe(true)
    expect(r.radius_miles).toBe(10)
    expect(r.limit).toBe(200)
  })
  it('defaults radius to 25 when invalid', () => {
    const r = coerceNearbyParams({ lat: 1, lng: 2, radius_miles: 7, limit: 5 }) as any
    expect(r.ok).toBe(true)
    expect(r.radius_miles).toBe(25)
    expect(r.limit).toBe(5)
  })
})


