import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { sale_id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify sale exists and is published
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('id, status')
      .eq('id', params.sale_id)
      .eq('status', 'published')
      .single()
    
    if (saleError || !sale) {
      return NextResponse.json({ error: 'Sale not found or not published' }, { status: 404 })
    }
    
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        sale_id: params.sale_id
      })
      .select()
      .single()
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Already favorited' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sale_id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('sale_id', params.sale_id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
