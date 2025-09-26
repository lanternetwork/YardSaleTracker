import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const negativeMatchSchema = z.object({
  sale_id_b: z.string().uuid('Invalid sale ID')
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { sale_id_b } = negativeMatchSchema.parse(body)
    
    const supabase = createSupabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check if user owns the first sale
    const { data: saleA, error: saleAError } = await supabase
      .from('sales')
      .select('id, owner_id')
      .eq('id', params.id)
      .single()
    
    if (saleAError || !saleA || saleA.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Check if user owns the second sale
    const { data: saleB, error: saleBError } = await supabase
      .from('sales')
      .select('id, owner_id')
      .eq('id', sale_id_b)
      .single()
    
    if (saleBError || !saleB || saleB.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Create negative match
    const { data: negativeMatch, error } = await supabase
      .from('negative_matches')
      .insert({
        sale_id_a: params.id,
        sale_id_b: sale_id_b,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create negative match:', error)
      return NextResponse.json(
        { error: 'Failed to create negative match' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(negativeMatch)
  } catch (error) {
    console.error('Error creating negative match:', error)
    
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
