// Privacy masking utilities for sales data

export interface Sale {
  id: string
  title: string
  lat?: number
  lng?: number
  privacy_mode?: 'exact' | 'block_until_24h'
  date_start?: string
  time_start?: string
  [key: string]: any
}

export interface PrivacySale {
  privacy_mode?: 'exact' | 'block_until_24h'
  date_start?: string
  time_start?: string
  lat?: number
  lng?: number
}

/**
 * Get the sale start datetime in the local timezone
 * @param sale - The sale object
 * @returns Date object for the sale start time
 */
export function getSaleStartZoned(sale: PrivacySale): Date | null {
  if (!sale.date_start || !sale.time_start) {
    return null
  }

  // Create a date in the local timezone
  const startDate = new Date(`${sale.date_start}T${sale.time_start}`)
  return startDate
}

/**
 * Determines if a sale's coordinates should be masked
 * @param sale - The sale object
 * @param now - Current timestamp (defaults to now)
 * @returns true if coordinates should be masked
 */
export function shouldMask(sale: PrivacySale, now: Date = new Date()): boolean {
  if (sale.privacy_mode !== 'block_until_24h') {
    return false
  }

  const startDate = getSaleStartZoned(sale)
  if (!startDate) {
    return false
  }

  // Calculate 24 hours before start
  const revealTime = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
  return now < revealTime
}

/**
 * Masks coordinates to block-level precision
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Masked coordinates (rounded to ~3 decimal places)
 */
export function maskCoords(lat: number, lng: number): { lat: number; lng: number } {
  // Round to ~3 decimal places for block-level precision
  // This gives approximately 100m precision
  return {
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round(lng * 1000) / 1000
  }
}

/**
 * Applies privacy masking to a sale object
 * @param sale - The sale object
 * @param now - Current timestamp (defaults to now)
 * @returns Sale with masked coordinates if needed
 */
export function applyPrivacyMasking(sale: Sale, now: Date = new Date()): Sale {
  if (!shouldMask(sale, now) || !sale.lat || !sale.lng) {
    return sale
  }

  const masked = maskCoords(sale.lat, sale.lng)
  
  return {
    ...sale,
    lat: masked.lat,
    lng: masked.lng,
    is_masked: true,
    reveal_time: new Date(new Date(`${sale.date_start}T${sale.time_start}`).getTime() - 24 * 60 * 60 * 1000).toISOString()
  }
}

/**
 * Calculates time remaining until reveal
 * @param sale - The sale object
 * @param now - Current timestamp (defaults to now)
 * @returns Time remaining in milliseconds, or 0 if already revealed
 */
export function getRevealTimeRemaining(sale: PrivacySale, now: Date = new Date()): number {
  if (sale.privacy_mode !== 'block_until_24h' || !sale.date_start || !sale.time_start) {
    return 0
  }

  const startDate = new Date(`${sale.date_start}T${sale.time_start}`)
  const revealTime = new Date(startDate.getTime() - 24 * 60 * 60 * 1000)
  
  return Math.max(0, revealTime.getTime() - now.getTime())
}

/**
 * Formats time remaining as a human-readable string
 * @param sale - The sale object
 * @param now - Current timestamp (defaults to now)
 * @returns Formatted time string (e.g., "2h 30m" or "Revealed")
 */
export function formatRevealTimeRemaining(sale: PrivacySale, now: Date = new Date()): string {
  const remaining = getRevealTimeRemaining(sale, now)
  
  if (remaining === 0) {
    return 'Revealed'
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}
