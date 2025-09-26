/**
 * Privacy masking helper for sales data
 * Implements block-level privacy for sales with privacy_mode='block_until_24h'
 */

export interface SaleLocation {
  lat: number
  lng: number
  address: string
  privacy_mode: 'exact' | 'block_until_24h'
  date_start: string
  time_start?: string
}

export interface MaskedLocation {
  lat: number
  lng: number
  address: string
  is_masked: boolean
  reveal_time?: string
}

/**
 * Masks location data based on privacy mode and timing
 */
export function maskLocation(sale: SaleLocation): MaskedLocation {
  if (sale.privacy_mode === 'exact') {
    return {
      lat: sale.lat,
      lng: sale.lng,
      address: sale.address,
      is_masked: false
    }
  }
  
  if (sale.privacy_mode === 'block_until_24h') {
    const now = new Date()
    const saleStart = new Date(`${sale.date_start}T${sale.time_start || '00:00:00'}`)
    const revealTime = new Date(saleStart.getTime() - 24 * 60 * 60 * 1000) // 24 hours before
    
    if (now < revealTime) {
      // Still masked - return block-level coordinates
      return {
        lat: roundToBlockLevel(sale.lat),
        lng: roundToBlockLevel(sale.lng),
        address: maskAddress(sale.address),
        is_masked: true,
        reveal_time: revealTime.toISOString()
      }
    } else {
      // Revealed - return exact coordinates
      return {
        lat: sale.lat,
        lng: sale.lng,
        address: sale.address,
        is_masked: false
      }
    }
  }
  
  // Default to exact
  return {
    lat: sale.lat,
    lng: sale.lng,
    address: sale.address,
    is_masked: false
  }
}

/**
 * Rounds coordinates to block level (approximately 100m precision)
 */
function roundToBlockLevel(coord: number): number {
  // Round to approximately 100m precision
  // 1 degree ≈ 111km, so 100m ≈ 0.0009 degrees
  const precision = 0.0009
  return Math.round(coord / precision) * precision
}

/**
 * Masks address to block level
 */
function maskAddress(address: string): string {
  // Extract street number and name, mask the rest
  const parts = address.split(',')
  if (parts.length === 0) return address
  
  const streetPart = parts[0].trim()
  const streetNumber = streetPart.match(/^\d+/)?.[0]
  
  if (streetNumber) {
    // Mask the street number
    const maskedNumber = streetNumber.slice(0, -2) + 'XX'
    const restOfStreet = streetPart.slice(streetNumber.length)
    return `${maskedNumber}${restOfStreet}, ${parts.slice(1).join(',').trim()}`
  }
  
  return address
}

/**
 * Gets the countdown text for when a sale will be revealed
 */
export function getRevealCountdown(revealTime: string): string {
  const now = new Date()
  const reveal = new Date(revealTime)
  const diff = reveal.getTime() - now.getTime()
  
  if (diff <= 0) {
    return 'Revealed'
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `Reveals in ${hours}h ${minutes}m`
  } else {
    return `Reveals in ${minutes}m`
  }
}

/**
 * Checks if a sale should be auto-hidden (past weekend)
 */
export function shouldAutoHide(sale: { date_start: string; date_end?: string }): boolean {
  const now = new Date()
  const saleEnd = new Date(sale.date_end || sale.date_start)
  
  // Hide if sale ended more than 7 days ago
  const daysSinceEnd = (now.getTime() - saleEnd.getTime()) / (1000 * 60 * 60 * 24)
  return daysSinceEnd > 7
}

/**
 * Gets the weekend range for a given date
 */
export function getWeekendRange(date: Date): { start: Date; end: Date } {
  const day = date.getDay()
  const start = new Date(date)
  const end = new Date(date)
  
  if (day === 5) { // Friday
    start.setDate(date.getDate())
    end.setDate(date.getDate() + 2)
  } else if (day === 6) { // Saturday
    start.setDate(date.getDate() - 1)
    end.setDate(date.getDate() + 1)
  } else if (day === 0) { // Sunday
    start.setDate(date.getDate() - 2)
    end.setDate(date.getDate())
  } else { // Weekday
    // Find next weekend
    const daysUntilFriday = (5 - day + 7) % 7
    start.setDate(date.getDate() + daysUntilFriday)
    end.setDate(date.getDate() + daysUntilFriday + 2)
  }
  
  return { start, end }
}
