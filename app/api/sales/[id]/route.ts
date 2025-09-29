import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { readDraftCookie, verifyDraftToken } from '@/lib/server/draftToken'

export const runtime = 'nodejs'

interface SaleUpdate {
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    
    const { data: sale, error } = await supabase
      .from('yard_sales')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching sale:', error)
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json(sale)

  } catch (error) {
    console.error('Error in GET /api/sales/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id
    const updateData: SaleUpdate = await request.json()
    
    const supabase = createSupabaseServer()
    
    // Check if user is authenticated and owns the sale
    const { data: { user } } = await supabase.auth.getUser()
    
    let isAuthorized = false
    
    if (user) {
      // Check if user owns the sale
      const { data: sale } = await supabase
        .from('yard_sales')
        .select('owner_id')
        .eq('id', saleId)
        .single()
      
      if (sale && sale.owner_id === user.id) {
        isAuthorized = true
      }
    }
    
    // If not authorized by user ownership, check draft token
    if (!isAuthorized) {
      const draftToken = readDraftCookie(request, saleId)
      
      if (draftToken) {
        // Get stored token hash
        const { data: tokenData } = await supabase
          .from('sale_draft_tokens')
          .select('token_hash')
          .eq('sale_id', saleId)
          .single()
        
        if (tokenData && await verifyDraftToken(draftToken, tokenData.token_hash)) {
          isAuthorized = true
        }
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }
    
    // Update the sale
    const { data: sale, error } = await supabase
      .from('yard_sales')
      .update({
        ...updateData,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', saleId)
      .select()
      .single()

    if (error) {
      console.error('Error updating sale:', error)
      return NextResponse.json(
        { error: 'Failed to update sale' },
        { status: 500 }
      )
    }

    return NextResponse.json({ saved: true, sale })

  } catch (error) {
    console.error('Error in PATCH /api/sales/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}