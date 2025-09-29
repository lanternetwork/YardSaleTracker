import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { readDraftCookie, verifyDraftToken } from '@/lib/server/draftToken'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saleId = params.id
    const { otherSaleId } = await request.json()
    
    if (!otherSaleId) {
      return NextResponse.json(
        { error: 'otherSaleId is required' },
        { status: 400 }
      )
    }

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
    
    // Insert negative match (idempotent)
    const { error } = await supabase
      .from('negative_matches')
      .upsert({
        sale_id_a: saleId,
        sale_id_b: otherSaleId,
        created_by: user?.id || null
      }, {
        onConflict: 'sale_id_a,sale_id_b'
      })

    if (error) {
      console.error('Error creating negative match:', error)
      return NextResponse.json(
        { error: 'Failed to record negative match' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Error in POST /api/sales/[id]/not-duplicate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
