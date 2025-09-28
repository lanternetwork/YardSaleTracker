import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export const runtime = 'nodejs'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    
    const { data: sale, error } = await supabase
      .from('sales')
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json()
    const supabase = createSupabaseServer()
    
    // Check if user is authenticated or has draft access
    const cookieStore = cookies()
    const draftToken = cookieStore.get('draft_session')?.value
    
    let hasAccess = false
    
    if (draftToken) {
      try {
        const { payload } = await jwtVerify(
          draftToken,
          new TextEncoder().encode(JWT_SECRET)
        )
        hasAccess = payload.saleId === params.id
      } catch (error) {
        // Token invalid, check auth
      }
    }
    
    // If no draft access, check if user is authenticated and owns the sale
    if (!hasAccess) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: sale } = await supabase
          .from('sales')
          .select('owner_id')
          .eq('id', params.id)
          .single()
        
        hasAccess = sale?.owner_id === user.id
      }
    }
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: sale, error } = await supabase
      .from('sales')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sale:', error)
      return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 })
    }

    return NextResponse.json(sale)

  } catch (error) {
    console.error('Error in PATCH /api/sales/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    
    // Check if user is authenticated and owns the sale
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sale } = await supabase
      .from('sales')
      .select('owner_id')
      .eq('id', params.id)
      .single()

    if (sale?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting sale:', error)
      return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Sale deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/sales/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}