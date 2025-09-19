import { describe, it, expect } from 'vitest'
import { 
  createPageMetadata, 
  createSaleMetadata, 
  createExploreMetadata,
  createHomepageStructuredData,
  createOrganizationStructuredData
} from '@/lib/metadata'
import { Sale } from '@/lib/types'

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://yardsalefinder.com'
  }
}))

describe('createPageMetadata', () => {
  it('should create basic page metadata', () => {
    const metadata = createPageMetadata({
      title: 'Test Page',
      description: 'Test description',
      path: '/test'
    })

    expect(metadata.title).toBe('Test Page | YardSaleFinder')
    expect(metadata.description).toBe('Test description')
    expect(metadata.openGraph?.title).toBe('Test Page | YardSaleFinder')
    expect(metadata.openGraph?.url).toBe('https://yardsalefinder.com/test')
  })

  it('should handle custom image', () => {
    const metadata = createPageMetadata({
      title: 'Test Page',
      path: '/test',
      image: 'https://example.com/image.jpg'
    })

    expect(metadata.openGraph?.images?.[0]?.url).toBe('https://example.com/image.jpg')
  })

  it('should handle relative image path', () => {
    const metadata = createPageMetadata({
      title: 'Test Page',
      path: '/test',
      image: '/image.jpg'
    })

    expect(metadata.openGraph?.images?.[0]?.url).toBe('https://yardsalefinder.com/image.jpg')
  })
})

describe('createSaleMetadata', () => {
  it('should create sale metadata', () => {
    const sale: Sale = {
      id: 'test-id',
      title: 'Test Sale',
      description: 'Test description',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      lat: 40.7128,
      lng: -74.0060,
      start_at: '2023-12-25T10:00:00Z',
      end_at: '2023-12-25T16:00:00Z',
      tags: ['furniture', 'clothing'],
      price_min: 10,
      price_max: 100,
      photos: ['https://example.com/photo.jpg'],
      contact: 'test@example.com',
      status: 'active',
      source: 'user'
    }

    const metadata = createSaleMetadata(sale)

    expect(metadata.title).toBe('Test Sale | YardSaleFinder')
    expect(metadata.description).toContain('Test description')
    expect(metadata.openGraph?.type).toBe('article')
    expect(metadata.openGraph?.images?.[0]?.url).toBe('https://example.com/photo.jpg')
  })

  it('should handle sale without description', () => {
    const sale: Sale = {
      id: 'test-id',
      title: 'Test Sale',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      tags: [],
      photos: [],
      status: 'active',
      source: 'user'
    }

    const metadata = createSaleMetadata(sale)

    expect(metadata.description).toContain('Test City')
  })
})

describe('createExploreMetadata', () => {
  it('should create explore metadata', () => {
    const metadata = createExploreMetadata()

    expect(metadata.title).toBe('Explore Yard Sales | YardSaleFinder')
    expect(metadata.description).toContain('Browse and discover')
    expect(metadata.openGraph?.url).toBe('https://yardsalefinder.com/explore')
  })
})

describe('createHomepageStructuredData', () => {
  it('should create homepage structured data', () => {
    const data = createHomepageStructuredData()

    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('WebSite')
    expect(data.name).toBe('YardSaleFinder')
    expect(data.url).toBe('https://yardsalefinder.com')
    expect(data.potentialAction['@type']).toBe('SearchAction')
  })
})

describe('createOrganizationStructuredData', () => {
  it('should create organization structured data', () => {
    const data = createOrganizationStructuredData()

    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('Organization')
    expect(data.name).toBe('YardSaleFinder')
    expect(data.url).toBe('https://yardsalefinder.com')
    expect(data.logo).toBe('https://yardsalefinder.com/icons/icon-512.png')
  })
})
