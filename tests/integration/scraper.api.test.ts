import { describe, it, expect, beforeEach } from 'vitest'
import { server } from '@/tests/setup'
import { http, HttpResponse } from 'msw'
import { parseCraigslistList } from '@/lib/scraper/parseCraigslist'
import { readCraigslistFixture } from '@/tests/utils/fs'

// Mock the Next.js API route
const mockApiRoute = async (req: Request) => {
  try {
    const body = await req.json()
    
    // Validate the request
    if (!body.city || !body.query) {
      return new Response(JSON.stringify({ error: 'City and query are required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      })
    }

    // Get the Supabase function URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return new Response(JSON.stringify({ error: 'Supabase URL not configured' }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      })
    }

    const functionUrl = `${supabaseUrl.replace('.co', '.co/functions/v1')}/craigslist`
    
    // Call the Supabase Edge Function
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return new Response(JSON.stringify({ error: 'Scraping failed', details: errorData }), {
        status: response.status,
        headers: { 'content-type': 'application/json' }
      })
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: { 'content-type': 'application/json' }
    })

  } catch (error) {
    console.error('API route error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    })
  }
}

describe('Scraper API Integration', () => {
  beforeEach(() => {
    // Reset environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE = 'test-service-role'
  })

  it('should successfully scrape and return results', async () => {
    // Mock successful Supabase function response
    const mockResults = parseCraigslistList(readCraigslistFixture('gms_basic.html'), 5)
    
    server.use(
      http.post('https://test.supabase.co/functions/v1/craigslist', () => {
        return HttpResponse.json({
          results: mockResults.map(item => ({
            id: item.id,
            title: item.title,
            description: `Found on Craigslist sfbay`,
            start_at: item.postedAt,
            price_min: item.price,
            price_max: item.price,
            source: 'craigslist',
            url: item.url
          })),
          total: mockResults.length,
          city: 'sfbay',
          query: 'garage sale'
        })
      })
    )

    const response = await mockApiRoute(new Request('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'sfbay', query: 'garage sale' })
    }))

    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.results).toBeDefined()
    expect(data.results.length).toBeGreaterThan(0)
    expect(data.results[0]).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      source: 'craigslist'
    })
  })

  it('should return 400 for missing city parameter', async () => {
    const response = await mockApiRoute(new Request('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'garage sale' })
    }))

    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('City and query are required')
  })

  it('should return 400 for missing query parameter', async () => {
    const response = await mockApiRoute(new Request('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'sfbay' })
    }))

    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.error).toBe('City and query are required')
  })

  it('should return 500 when Supabase URL is not configured', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL

    const response = await mockApiRoute(new Request('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'sfbay', query: 'garage sale' })
    }))

    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.error).toBe('Supabase URL not configured')
  })

  it('should handle Supabase function errors gracefully', async () => {
    server.use(
      http.post('https://test.supabase.co/functions/v1/craigslist', () => {
        return HttpResponse.json(
          { error: 'Function execution failed' },
          { status: 500 }
        )
      })
    )

    const response = await mockApiRoute(new Request('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'sfbay', query: 'garage sale' })
    }))

    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.error).toBe('Scraping failed')
    expect(data.details).toBeDefined()
  })

  it('should handle network errors gracefully', async () => {
    server.use(
      http.post('https://test.supabase.co/functions/v1/craigslist', () => {
        return HttpResponse.error()
      })
    )

    const response = await mockApiRoute(new Request('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'sfbay', query: 'garage sale' })
    }))

    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.error).toBe('Internal server error')
  })

  it('should return empty results array on function error', async () => {
    server.use(
      http.post('https://test.supabase.co/functions/v1/craigslist', () => {
        return HttpResponse.json({
          error: "Failed to scrape data",
          message: "Network timeout",
          results: []
        }, { status: 500 })
      })
    )

    const response = await mockApiRoute(new Request('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city: 'sfbay', query: 'garage sale' })
    }))

    expect(response.status).toBe(500)
    
    const data = await response.json()
    expect(data.error).toBe('Scraping failed')
    expect(data.details.results).toEqual([])
  })
})
