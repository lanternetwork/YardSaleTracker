import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { z } from 'zod'

const updateSaleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  address: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(2).max(2).optional(),
  zip: z.string().min(5).max(10).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  price_min: z.number().min(0).optional(),
  price_max: z.number().min(0).optional(),
  contact: z.string().max(100).optional(),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional()
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const validatedData = updateSaleSchema.parse(body)
    
    // Check ownership first
    const { data: existingSale, error: fetchError } = await supabase
      .from('sales')
      .select('owner_id')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }
    
    if (existingSale.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const { data, error } = await supabase
      .from('sales')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check ownership first
    const { data: existingSale, error: fetchError } = await supabase
      .from('sales')
      .select('owner_id')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !existingSale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }
    
    if (existingSale.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Archive instead of delete
    const { error } = await supabase
      .from('sales')
      .update({ 
        status: 'archived',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

