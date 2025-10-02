import { describe, it, expect } from 'vitest'

// Categories parsing function (copied from API for testing)
function parseCategories(categoriesParam: string | null): string[] {
  if (!categoriesParam) return []
  
  return categoriesParam
    .split(',')
    .map(c => c.trim())
    .filter(c => c.length > 0)
    .slice(0, 10) // Max 10 categories
}

describe('Categories Parsing', () => {
  it('should parse comma-separated categories', () => {
    expect(parseCategories('tools,electronics')).toEqual(['tools', 'electronics'])
    expect(parseCategories('tools, electronics')).toEqual(['tools', 'electronics'])
    expect(parseCategories('tools,electronics,furniture')).toEqual(['tools', 'electronics', 'furniture'])
  })

  it('should handle whitespace', () => {
    expect(parseCategories(' tools , electronics ')).toEqual(['tools', 'electronics'])
    expect(parseCategories('  tools  ,  electronics  ')).toEqual(['tools', 'electronics'])
  })

  it('should filter empty strings', () => {
    expect(parseCategories('tools,,electronics')).toEqual(['tools', 'electronics'])
    expect(parseCategories('tools, ,electronics')).toEqual(['tools', 'electronics'])
    expect(parseCategories(',tools,electronics,')).toEqual(['tools', 'electronics'])
  })

  it('should handle null/empty input', () => {
    expect(parseCategories(null)).toEqual([])
    expect(parseCategories('')).toEqual([])
    expect(parseCategories('   ')).toEqual([])
  })

  it('should limit to 10 categories', () => {
    const manyCategories = 'cat1,cat2,cat3,cat4,cat5,cat6,cat7,cat8,cat9,cat10,cat11,cat12'
    const result = parseCategories(manyCategories)
    expect(result).toHaveLength(10)
    expect(result[0]).toBe('cat1')
    expect(result[9]).toBe('cat10')
  })

  it('should handle single category', () => {
    expect(parseCategories('tools')).toEqual(['tools'])
    expect(parseCategories(' electronics ')).toEqual(['electronics'])
  })

  it('should handle special characters', () => {
    expect(parseCategories('home-garden,auto-parts')).toEqual(['home-garden', 'auto-parts'])
    expect(parseCategories('sports & recreation')).toEqual(['sports & recreation'])
  })
})
