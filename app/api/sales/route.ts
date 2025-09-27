import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const createSaleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  date_start: z.string().min(1, 'Start date is required'),
  date_end: z.string().optional(),
  time_start: z.string().optional(),
  time_end: z.string().optional(),
  privacy_mode: z.enum(['exact', 'block_until_24h']).default('exact'),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'hidden', 'auto_hidden']).default('draft')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSaleSchema.parse(body)
    
    const supabase = createSupabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      // Create draft without owner_id (anonymous draft)
      const { data: sale, error } = await supabase
        .from('sales')
        .insert({
          ...validatedData,
          owner_id: null,
          source: 'manual',
          source_id: null
        })
        .select()
        .single()
      
      if (error) {
        console.error('Failed to create anonymous draft:', error)
        return NextResponse.json(
          { error: 'Failed to create draft' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ id: sale.id })
    }
    
    // Create sale with authenticated user
    const { data: sale, error } = await supabase
      .from('sales')
      .insert({
        ...validatedData,
        owner_id: user.id,
        source: 'manual',
        source_id: null
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create sale:', error)
      return NextResponse.json(
        { error: 'Failed to create sale' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ id: sale.id })
  } catch (error) {
    console.error('Error creating sale:', error)
    
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
