import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServer } from '@/lib/supabase/server'
import { findDuplicateCandidates } from '@/lib/sales/dedupe'

export const runtime = 'nodejs'

const DRAFT_SECRET = process.env.DRAFT_SECRET || 'fallback-draft-secret'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get the sale
    const { data: sale, error: saleError } = await supabase
      .from('yard_sales')
      .select('*')
      .eq('id', params.id)
      .single()

    if (saleError || !sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    // Validate required fields for publishing
    if (!sale.title || !sale.date_start || !sale.time_start || !sale.address) {
      return NextResponse.json(
        { error: 'Missing required fields for publishing' },
        { status: 400 }
      )
    }

    // Check for duplicates before publishing
    const { force } = await request.json().catch(() => ({}))
    
    if (!force) {
      try {
        const candidates = await findDuplicateCandidates({
          lat: sale.lat,
          lng: sale.lng,
          title: sale.title,
          date_start: sale.date_start,
          date_end: sale.date_end
        })
        
        if (candidates.length > 0) {
          return NextResponse.json(
            { 
              error: 'Potential duplicates found',
              candidates: candidates.slice(0, 3) // Return top 3 candidates
            },
            { status: 409 }
          )
        }
      } catch (error) {
        console.error('Error checking duplicates:', error)
        // Continue with publish if dedupe check fails
      }
    }

    // Update sale to published status and assign ownership
    const { data: updatedSale, error: updateError } = await supabase
      .from('yard_sales')
      .update({
        status: 'published',
        owner_id: user.id,
        first_seen_at: sale.first_seen_at || new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error publishing sale:', updateError)
      return NextResponse.json({ error: 'Failed to publish sale' }, { status: 500 })
    }

    // Clear draft cookie
    const cookieStore = cookies()
    cookieStore.delete('draft_session')

    return NextResponse.json({
      message: 'Sale published successfully',
      redirectUrl: `/sell/${params.id}/manage`
    })

  } catch (error) {
    console.error('Error in POST /api/sales/[id]/publish:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}