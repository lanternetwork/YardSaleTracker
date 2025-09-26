import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateSaleSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  address: z.string().min(1).optional(),
  date_start: z.string().min(1).optional(),
  date_end: z.string().optional(),
  time_start: z.string().optional(),
  time_end: z.string().optional(),
  privacy_mode: z.enum(['exact', 'block_until_24h']).optional(),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'hidden', 'auto_hidden']).optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    
    // Get the sale
    const { data: sale, error } = await supabase
      .from('sales')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error || !sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }
    
    // Check if user can view this sale
    const { data: { user } } = await supabase.auth.getUser()
    
    if (sale.status !== 'published' && (!user || sale.owner_id !== user.id)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(sale)
  } catch (error) {
    console.error('Error fetching sale:', error)
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
    const body = await request.json()
    const validatedData = updateSaleSchema.parse(body)
    
    const supabase = createSupabaseServer()
    
    // Get the sale first
    const { data: sale, error: fetchError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (fetchError || !sale) {
      return NextResponse.json(
        { error: 'Sale not found' },
        { status: 404 }
      )
    }
    
    // Check if user can update this sale
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || sale.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Update the sale
    const { data: updatedSale, error } = await supabase
      .from('sales')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to update sale:', error)
      return NextResponse.json(
        { error: 'Failed to update sale' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(updatedSale)
  } catch (error) {
    console.error('Error updating sale:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
