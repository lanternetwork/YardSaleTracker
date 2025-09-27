import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseServer()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get the sale
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
    
    // Check if user can publish this sale
    if (sale.owner_id && sale.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Claim the draft if it's anonymous
    if (!sale.owner_id) {
      const { error: claimError } = await supabase
        .from('sales')
        .update({ owner_id: user.id })
        .eq('id', params.id)
      
      if (claimError) {
        console.error('Failed to claim draft:', claimError)
        return NextResponse.json(
          { error: 'Failed to claim draft' },
          { status: 500 }
        )
      }
    }
    
    // Run dedupe check
    const duplicates = await checkForDuplicates(supabase, sale)
    
    if (duplicates.length > 0) {
      return NextResponse.json({
        error: 'Possible duplicates found',
        duplicates: duplicates.map(d => ({
          id: d.id,
          title: d.title,
          address: d.address,
          date_start: d.date_start,
          distance: d.distance
        }))
      }, { status: 409 })
    }
    
    // Publish the sale
    const { data: publishedSale, error } = await supabase
      .from('sales')
      .update({
        status: 'published',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to publish sale:', error)
      return NextResponse.json(
        { error: 'Failed to publish sale' },
        { status: 500 }
      )
    }
    
    return NextResponse.json(publishedSale)
  } catch (error) {
    console.error('Error publishing sale:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function checkForDuplicates(supabase: any, sale: any) {
  try {
    // Get sales within 150m and overlapping dates
    const { data: candidates, error } = await supabase
      .from('sales')
      .select('id, title, address, date_start, lat, lng')
      .eq('status', 'published')
      .neq('id', sale.id)
    
    if (error || !candidates) return []
    
    // Filter by distance and date overlap
    const duplicates = []
    
    for (const candidate of candidates) {
      // Check date overlap
      const saleStart = new Date(sale.date_start)
      const saleEnd = new Date(sale.date_end || sale.date_start)
      const candidateStart = new Date(candidate.date_start)
      
      if (candidateStart >= saleStart && candidateStart <= saleEnd) {
        // Check distance (simplified - in production, use proper distance calculation)
        if (sale.lat && sale.lng && candidate.lat && candidate.lng) {
          const distance = calculateDistance(
            sale.lat, sale.lng,
            candidate.lat, candidate.lng
          )
          
          if (distance <= 0.15) { // 150m in degrees (approximate)
            // Check title similarity
            const similarity = calculateSimilarity(sale.title, candidate.title)
            
            if (similarity >= 0.35) {
              duplicates.push({
                ...candidate,
                distance: distance * 111000 // Convert to meters
              })
            }
          }
        }
      }
    }
    
    return duplicates.slice(0, 3) // Return top 3
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return []
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  
  // Simple similarity calculation
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  
  const commonWords = words1.filter(word => words2.includes(word))
  const totalWords = new Set([...words1, ...words2]).size
  
  return commonWords.length / totalWords
}
