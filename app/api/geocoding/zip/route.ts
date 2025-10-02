import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

// Nominatim rate limiting (1 request per second)
let lastNominatimCall = 0
const NOMINATIM_DELAY = 1000 // 1 second

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function lookupNominatim(zip: string): Promise<any> {
  // Rate limiting: ensure at least 1 second between calls
  const now = Date.now()
  const timeSinceLastCall = now - lastNominatimCall
  if (timeSinceLastCall < NOMINATIM_DELAY) {
    await delay(NOMINATIM_DELAY - timeSinceLastCall)
  }
  lastNominatimCall = Date.now()

  const email = process.env.NOMINATIM_EMAIL || 'admin@lootaura.com'
  const url = `https://nominatim.openstreetmap.org/search?postalcode=${zip}&country=US&format=json&limit=1&email=${email}`
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': `LootAura/1.0 (${email})`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Nominatim request failed: ${response.status}`)
  }
  
  const data = await response.json()
  return data
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const zip = searchParams.get('zip')
    
    // Validate ZIP format
    if (!zip || !/^\d{5}$/.test(zip)) {
      console.log(`[ZIP] zip=${zip} status=invalid`)
      return NextResponse.json({ 
        ok: false, 
        error: 'Invalid ZIP' 
      }, { status: 400 })
    }
    
    const supabase = createSupabaseServerClient()
    
    // 1. Try local lookup first
    console.log(`[ZIP] zip=${zip} source=local`)
    const { data: localData, error: localError } = await supabase
      .from('zipcodes')
      .select('zip, lat, lng, city, state')
      .eq('zip', zip)
      .single()
    
    if (!localError && localData) {
      console.log(`[ZIP] zip=${zip} source=local status=ok`)
      return NextResponse.json({
        ok: true,
        zip: localData.zip,
        lat: localData.lat,
        lng: localData.lng,
        city: localData.city,
        state: localData.state,
        source: 'local'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      })
    }
    
    // 2. Fallback to Nominatim
    console.log(`[ZIP] zip=${zip} source=nominatim`)
    try {
      const nominatimData = await lookupNominatim(zip)
      
      if (nominatimData && nominatimData.length > 0) {
        const result = nominatimData[0]
        const lat = parseFloat(result.lat)
        const lng = parseFloat(result.lon)
        const city = result.address?.city || result.address?.town || result.address?.village || null
        const state = result.address?.state || null
        
        // Optional write-back to local table
        const enableWriteback = process.env.ENABLE_ZIP_WRITEBACK === 'true'
        if (enableWriteback) {
          try {
            await supabase
              .from('zipcodes')
              .upsert({
                zip,
                lat,
                lng,
                city,
                state
              }, { onConflict: 'zip' })
            console.log(`[ZIP] zip=${zip} source=nominatim writeback=success`)
          } catch (writebackError) {
            console.error(`[ZIP] zip=${zip} source=nominatim writeback=failed`, writebackError)
          }
        }
        
        console.log(`[ZIP] zip=${zip} source=nominatim status=ok`)
        return NextResponse.json({
          ok: true,
          zip,
          lat,
          lng,
          city,
          state,
          source: 'nominatim'
        }, {
          headers: {
            'Cache-Control': 'public, max-age=86400'
          }
        })
      } else {
        console.log(`[ZIP] zip=${zip} source=nominatim status=miss`)
        return NextResponse.json({ 
          ok: false, 
          error: 'ZIP not found' 
        }, { status: 404 })
      }
    } catch (nominatimError: any) {
      console.error(`[ZIP] zip=${zip} source=nominatim status=error`, nominatimError.message)
      return NextResponse.json({ 
        ok: false, 
        error: 'Geocoding service unavailable' 
      }, { status: 503 })
    }
    
  } catch (error: any) {
    console.error('[ZIP] Fatal error:', error.message)
    return NextResponse.json({ 
      ok: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
