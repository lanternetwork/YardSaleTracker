import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

export const runtime = 'nodejs'

const DRAFT_SECRET = process.env.DRAFT_SECRET || 'fallback-draft-secret'

interface SaleData {
  title: string
  description?: string
  photos?: string[]
  date_start: string
  date_end?: string
  time_start: string
  time_end?: string
  address: string
  lat?: number
  lng?: number
  privacy_mode: 'exact' | 'block_until_24h'
}

export async function POST(request: NextRequest) {
  try {
    const saleData: SaleData = await request.json()
    
    // Validate required fields
    if (!saleData.title || !saleData.date_start || !saleData.time_start || !saleData.address) {
      return NextResponse.json(
        { error: 'Missing required fields: title, date_start, time_start, address' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServer()
    
    // Create draft sale
    const { data: sale, error } = await supabase
      .from('yard_sales')
      .insert({
        title: saleData.title,
        description: saleData.description,
        address: saleData.address,
        lat: saleData.lat,
        lng: saleData.lng,
        date_start: saleData.date_start,
        date_end: saleData.date_end,
        time_start: saleData.time_start,
        time_end: saleData.time_end,
        privacy_mode: saleData.privacy_mode,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating sale:', error)
      return NextResponse.json({ error: 'Failed to create sale' }, { status: 500 })
    }

    // Create simple token for draft access
    const token = createHash('sha256')
      .update(`${sale.id}:${DRAFT_SECRET}`)
      .digest('hex')

    // Set HttpOnly cookie for draft access
    const cookieStore = cookies()
    cookieStore.set('draft_session', `${sale.id}:${token}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return NextResponse.json({ 
      id: sale.id,
      message: 'Draft created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/sales:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}