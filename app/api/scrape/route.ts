import { NextResponse } from 'next/server'
import { scraperLogger } from '@/lib/scraper/logger'

export async function POST(req: Request) {
  const correlationId = `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    const body = await req.json()
    
    // Validate the request
    if (!body.city || !body.query) {
      scraperLogger.warn('Missing required parameters', { correlationId, ...body })
      return NextResponse.json(
        { error: 'City and query are required' },
        { status: 400 }
      )
    }

    scraperLogger.info('Starting scrape request', { 
      correlationId, 
      city: body.city, 
      query: body.query,
      operation: 'api_proxy'
    })

    // Get the Supabase function URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      scraperLogger.error('Supabase URL not configured', undefined, { correlationId })
      return NextResponse.json(
        { error: 'Supabase URL not configured' },
        { status: 500 }
      )
    }

    const functionUrl = `${supabaseUrl.replace('.co', '.co/functions/v1')}/craigslist`
    
    // Call the Supabase Edge Function with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
          'User-Agent': 'YardSaleTracker-API/1.0'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json()
        scraperLogger.error('Supabase function error', undefined, { 
          correlationId, 
          city: body.city, 
          query: body.query,
          operation: 'supabase_function'
        })
        return NextResponse.json(
          { error: 'Scraping failed', details: errorData },
          { status: response.status }
        )
      }

      const data = await response.json()
      scraperLogger.info('Scrape completed successfully', { 
        correlationId, 
        city: body.city, 
        query: body.query,
        operation: 'api_proxy'
      })
      
      return NextResponse.json(data)

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        scraperLogger.error('Request timeout', fetchError, { 
          correlationId, 
          city: body.city, 
          query: body.query,
          operation: 'api_proxy'
        })
        return NextResponse.json(
          { error: 'Request timeout', results: [] },
          { status: 408 }
        )
      }
      
      throw fetchError
    }

  } catch (error) {
    scraperLogger.error('API route error', error as Error, { correlationId })
    
    // Always return results array on error to prevent UI crashes
    return NextResponse.json(
      { error: 'Internal server error', results: [] },
      { status: 500 }
    )
  }
}
