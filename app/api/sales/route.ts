import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { mintDraftToken, hashToken, setDraftCookie } from '@/lib/server/draftToken'

export const runtime = 'nodejs'

interface SaleData {
  title?: string
  description?: string
  photos?: string[]
  date_start?: string
  date_end?: string
  time_start?: string
  time_end?: string
  address?: string
  lat?: number
  lng?: number
  privacy_mode?: 'exact' | 'block_until_24h'
}

export async function POST(request: NextRequest) {
  try {
    const saleData: SaleData = await request.json()
    
    const supabase = createSupabaseServer()
    
    // Create draft sale with minimal required fields
    const { data: sale, error } = await supabase
      .from('yard_sales')
      .insert({
        title: saleData.title || 'Untitled Sale',
        description: saleData.description,
        address: saleData.address,
        lat: saleData.lat,
        lng: saleData.lng,
        date_start: saleData.date_start,
        date_end: saleData.date_end,
        time_start: saleData.time_start,
        time_end: saleData.time_end,
        privacy_mode: saleData.privacy_mode || 'exact',
        status: 'draft',
        photos: saleData.photos || []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sale:', error)
      return NextResponse.json(
        { error: 'Failed to create sale' },
        { status: 500 }
      )
    }

    // Generate draft token and store hash
    const token = mintDraftToken()
    const tokenHash = hashToken(token)
    
    // Store token hash in database
    const { error: tokenError } = await supabase
      .from('sale_draft_tokens')
      .insert({
        sale_id: sale.id,
        token_hash: tokenHash
      })

    if (tokenError) {
      console.error('Error storing draft token:', tokenError)
      return NextResponse.json(
        { error: 'Failed to create draft token' },
        { status: 500 }
      )
    }

    // Set draft cookie
    const response = NextResponse.json({ id: sale.id })
    setDraftCookie(response, sale.id, token)

    return response
  } catch (error) {
    console.error('Error in POST /api/sales:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}