import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const saleId = params.id

    // Verify ownership
    const { data: sale, error: fetchError } = await supabase
      .from('yard_sales')
      .select('owner_id, status')
      .eq('id', saleId)
      .single()

    if (fetchError || !sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    if (sale.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Unhide the sale (idempotent)
    const { error: updateError } = await supabase
      .from('yard_sales')
      .update({ 
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', saleId)

    if (updateError) {
      console.error('Error unhiding sale:', updateError)
      return NextResponse.json({ error: 'Failed to unhide sale' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in POST /api/account/sales/[id]/unhide:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
