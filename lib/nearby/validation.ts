export const ALLOWED_RADII = [5, 10, 25, 50, 100]

export function coerceNearbyParams(params: { lat?: unknown; lng?: unknown; radius_miles?: unknown; limit?: unknown }) {
  const lat = typeof params.lat === 'string' ? parseFloat(params.lat) : (params.lat as number)
  const lng = typeof params.lng === 'string' ? parseFloat(params.lng) : (params.lng as number)
  if (typeof lat !== 'number' || Number.isNaN(lat) || typeof lng !== 'number' || Number.isNaN(lng)) {
    return { ok: false as const, error: 'lat and lng are required' }
  }
  const rRaw = typeof params.radius_miles === 'string' ? parseFloat(params.radius_miles) : (params.radius_miles as number)
  const radius_miles = ALLOWED_RADII.includes(rRaw as any) ? (rRaw as number) : 25
  const lRaw = typeof params.limit === 'string' ? parseInt(params.limit) : (params.limit as number)
  const limit = Math.min(Math.max(typeof lRaw === 'number' && !Number.isNaN(lRaw) ? lRaw : 200, 1), 200)
  return { ok: true as const, lat, lng, radius_miles, limit }
}


