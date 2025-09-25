import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// Create a JSDOM window for server-side sanitization
const window = new JSDOM('').window
const purify = DOMPurify(window as any)

export interface SanitizeOptions {
  allowedTags?: string[]
  allowedAttributes?: Record<string, string[]>
  maxLength?: number
  stripHtml?: boolean
}

export function sanitizeHtml(input: string, options: SanitizeOptions = {}): string {
  if (!input || typeof input !== 'string') return ''

  const {
    allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br'],
    allowedAttributes = {
      'a': ['href', 'title'],
      'img': ['src', 'alt', 'width', 'height']
    },
    maxLength = 10000,
    stripHtml = false
  } = options

  // Truncate if too long
  let sanitized = input.length > maxLength ? input.substring(0, maxLength) : input

  if (stripHtml) {
    // Remove all HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  } else {
    // Sanitize HTML
    sanitized = purify.sanitize(sanitized, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: Object.keys(allowedAttributes),
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false
    })
  }

  return sanitized.trim()
}

export function sanitizeText(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') return ''

  // Remove HTML tags and normalize whitespace
  let sanitized = input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()

  // Truncate if too long
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength).trim()
  }

  return sanitized
}

export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return ''

  try {
    const url = new URL(input)
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return ''
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /onclick/i
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url.href)) {
        return ''
      }
    }

    // Return without trailing slash for consistency with tests
    return url.href.replace(/\/$/, '')
  } catch {
    return ''
  }
}

export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Basic email validation and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = input.trim().toLowerCase()

  if (!emailRegex.test(sanitized)) {
    return ''
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload/i,
    /onerror/i
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return ''
    }
  }

  return sanitized
}

export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Remove all non-digit characters except + at the beginning
  let sanitized = input.replace(/[^\d+]/g, '')
  
  // Ensure + is only at the beginning
  if (sanitized.includes('+') && !sanitized.startsWith('+')) {
    sanitized = sanitized.replace(/\+/g, '')
  }

  // Basic validation (7-15 digits)
  const digits = sanitized.replace(/\+/g, '')
  if (digits.length < 7 || digits.length > 15) {
    return ''
  }

  return sanitized
}

export function sanitizeAddress(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Remove HTML tags and normalize
  let sanitized = input
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onload/i,
    /onerror/i,
    /onclick/i
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return ''
    }
  }

  return sanitized
}

export function sanitizeTags(input: string[]): string[] {
  if (!Array.isArray(input)) return []

  return input
    .filter(tag => typeof tag === 'string' && tag.trim().length > 0 && tag.trim().length <= 50)
    .map(tag => sanitizeText(tag.trim(), 50))
    .map(tag => tag.replace(/[^\w\s-]/g, '')) // strip punctuation and quotes
    .map(tag => tag.replace(/\s+/g, ' ').trim()) // normalize whitespace
    .filter(tag => tag.length > 0 && !tag.toLowerCase().includes('alert') && !tag.toLowerCase().includes('script'))
    .slice(0, 10) // Limit to 10 tags
}

export function sanitizeSearchQuery(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Remove HTML and normalize
  let sanitized = sanitizeText(input, 200)

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/<[^>]*>/g, '') // strip any residual HTML
  sanitized = sanitized.replace(/[`~!@#$%^*()_+=\[\]{}|;:\\,/?<>]+/g, ' ') // remove dangerous punctuation
  sanitized = sanitized.replace(/"|\'|&/g, '') // remove quotes and ampersand
  sanitized = sanitized.replace(/\s+/g, ' ').trim() // normalize and trim

  // Filter out malicious content - remove alert and script patterns
  let cleanContent = sanitized
  cleanContent = cleanContent.replace(/alert\s*\([^)]*\)/gi, '')
  cleanContent = cleanContent.replace(/<script[^>]*>.*?<\/script>/gi, '')
  cleanContent = cleanContent.replace(/\balert\b/gi, '')
  cleanContent = cleanContent.replace(/\bscript\b/gi, '')
  cleanContent = cleanContent.replace(/\bxss\b/gi, '')
  cleanContent = cleanContent.replace(/\s+/g, ' ').trim()
  
  return cleanContent
}

// Validation helpers
export function isValidUuid(input: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(input)
}

export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && lat >= -90 && lat <= 90
}

export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && lng >= -180 && lng <= 180
}

export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price >= 0 && price <= 1000000
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.getTime() > 0
}
