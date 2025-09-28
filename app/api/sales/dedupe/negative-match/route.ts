import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { saleIdA, saleIdB, userId } = await request.json()
    
    if (!saleIdA || !saleIdB) {
      return NextResponse.json({ error: 'Missing sale IDs' }, { status: 400 })
    }

    const supabase = createSupabaseServer()
    
    // Ensure consistent ordering (smaller ID first)
    const [idA, idB] = [saleIdA, saleIdB].sort()
    
    const { error } = await supabase
      .from('negative_matches')
      .insert({
        sale_id_a: idA,
        sale_id_b: idB,
        created_by: userId || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error recording negative match:', error)
      return NextResponse.json({ error: 'Failed to record negative match' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in POST /api/sales/dedupe/negative-match:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const saleIdA = searchParams.get('saleIdA')
    const saleIdB = searchParams.get('saleIdB')
    
    if (!saleIdA || !saleIdB) {
      return NextResponse.json({ error: 'Missing sale IDs' }, { status: 400 })
    }

    const supabase = createSupabaseServer()
    
    const [idA, idB] = [saleIdA, saleIdB].sort()
    
    const { data, error } = await supabase
      .from('negative_matches')
      .select('id')
      .eq('sale_id_a', idA)
      .eq('sale_id_b', idB)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking negative match:', error)
      return NextResponse.json({ exists: false })
    }

    return NextResponse.json({ exists: !!data })

  } catch (error) {
    console.error('Error in GET /api/sales/dedupe/negative-match:', error)
    return NextResponse.json({ exists: false })
  }
}
