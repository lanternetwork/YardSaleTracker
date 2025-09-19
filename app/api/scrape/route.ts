import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate the request
    if (!body.city || !body.query) {
      return NextResponse.json(
        { error: 'City and query are required' },
        { status: 400 }
      )
    }

    // Get the Supabase function URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase URL not configured' },
        { status: 500 }
      )
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
      return NextResponse.json(
        { error: 'Scraping failed', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
