import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { createHash } from 'crypto'

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

    // Check for duplicates (but don't block - just log)
    try {
      const response = await fetch('/api/sales/dedupe/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sale)
      })
      
      if (response.ok) {
        const candidates = await response.json()
        if (candidates.length > 0) {
          console.log(`Found ${candidates.length} potential duplicates for sale ${sale.id}`)
        }
      }
    } catch (error) {
      console.error('Error checking duplicates:', error)
      // Don't fail the publish for dedupe errors
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