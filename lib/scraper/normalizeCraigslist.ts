import { ParsedItem } from './parseCraigslist'
import { SaleSchema } from '@/lib/zodSchemas'

export interface SaleMinimal {
  title: string
  description?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  start_at?: string
  end_at?: string
  lat?: number
  lng?: number
  // (deprecated; yard sales do not have sale-level prices)
  tags: string[]
  photos: string[]
  source: 'craigslist'
}

/**
 * Normalize a parsed Craigslist item to internal Sale format
 */
export function normalizeCraigslistItem(item: ParsedItem, city: string = 'sfbay'): SaleMinimal {
  // Extract tags from title keywords
  const tags = extractTagsFromTitle(item.title)
  
  // (deprecated; yard sales do not have sale-level prices)
  
  // Create normalized sale object
  const normalized: SaleMinimal = {
    title: item.title,
    description: `Found on Craigslist ${city}`,
    start_at: item.postedAt,
    // (deprecated; yard sales do not have sale-level prices)
    tags,
    photos: [],
    source: 'craigslist'
  }
  
  // Only include defined fields (not null/undefined)
  const result: Partial<SaleMinimal> = {}
  
  Object.entries(normalized).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value) && value.length === 0) {
        // Include empty arrays
        result[key as keyof SaleMinimal] = value as any
      } else if (!Array.isArray(value) && value !== '') {
        // Include non-empty strings and other values
        result[key as keyof SaleMinimal] = value as any
      }
    }
  })
  
  return result as SaleMinimal
}

/**
 * Extract tags from title based on keywords
 */
function extractTagsFromTitle(title: string): string[] {
  const titleLower = title.toLowerCase()
  const tags: string[] = []
  
  // Define keyword mappings
  const keywordMap: Record<string, string> = {
    'multi-family': 'multi-family',
    'moving': 'moving',
    'estate': 'estate',
    'tools': 'tools',
    'furniture': 'furniture',
    'antique': 'antique',
    'kids': 'kids',
    'toys': 'toys',
    'books': 'books',
    'electronics': 'electronics',
    'appliances': 'appliances',
    'clothing': 'clothing',
    'accessories': 'accessories',
    'collectibles': 'collectibles',
    'art': 'art',
    'hardware': 'hardware',
    'garage': 'garage',
    'yard': 'yard'
  }
  
  // Check for keywords
  Object.entries(keywordMap).forEach(([keyword, tag]) => {
    if (titleLower.includes(keyword)) {
      tags.push(tag)
    }
  })
  
  // Add source tag
  tags.push('craigslist')
  
  return [...new Set(tags)] // Remove duplicates
}

/**
 * Validate normalized sale against schema
 */
export function validateNormalizedSale(sale: SaleMinimal): { valid: boolean; errors: string[] } {
  try {
    SaleSchema.parse(sale)
    return { valid: true, errors: [] }
  } catch (error: any) {
    const errors = error.errors?.map((e: any) => `${e.path.join('.')}: ${e.message}`) || ['Unknown validation error']
    return { valid: false, errors }
  }
}
