import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase/server'
import { calculateDistance, dateRangesOverlap, calculateStringSimilarity, Sale, DedupeCandidate } from '@/lib/sales/dedupe-utils'

export const runtime = 'nodejs'


export async function POST(request: NextRequest) {
  try {
    const newSale: Sale = await request.json()
    
    if (!newSale.lat || !newSale.lng || !newSale.title || !newSale.date_start) {
      return NextResponse.json([])
    }

    const supabase = createSupabaseServer()
    const maxDistance = 150 // meters
    const minSimilarity = 0.35

    // Get candidates within distance using bounding box
    const latDelta = maxDistance / 111000 // Rough conversion: 1 degree ≈ 111km
    const lngDelta = maxDistance / (111000 * Math.cos(newSale.lat * Math.PI / 180))

    const { data: candidates, error } = await supabase
      .from('sales')
      .select('*')
      .eq('status', 'published')
      .gte('lat', newSale.lat - latDelta)
      .lte('lat', newSale.lat + latDelta)
      .gte('lng', newSale.lng - lngDelta)
      .lte('lng', newSale.lng + lngDelta)
      .neq('id', newSale.id) // Exclude self

    if (error) {
      console.error('Error fetching candidates:', error)
      return NextResponse.json([])
    }

    if (!candidates || candidates.length === 0) {
      return NextResponse.json([])
    }

    // Filter by exact distance and date overlap
    const validCandidates = candidates.filter(candidate => {
      if (!candidate.lat || !candidate.lng || !candidate.date_start) {
        return false
      }

      const distance = calculateDistance(
        newSale.lat!, newSale.lng!,
        candidate.lat!, candidate.lng!
      )

      if (distance > maxDistance) {
        return false
      }

      // Check date overlap
      if (!dateRangesOverlap(
        newSale.date_start, newSale.date_end,
        candidate.date_start, candidate.date_end
      )) {
        return false
      }

      return true
    })

    // Calculate trigram similarity and rank
    const candidatesWithScores = validCandidates.map(candidate => {
      const distance = calculateDistance(
        newSale.lat!, newSale.lng!,
        candidate.lat!, candidate.lng!
      )

      const similarity = calculateStringSimilarity(newSale.title, candidate.title)

      return {
        sale: candidate,
        distance,
        similarity,
        reason: `Distance: ${Math.round(distance)}m, Similarity: ${(similarity * 100).toFixed(1)}%`
      }
    })

    // Filter by minimum similarity and sort by score
    const results = candidatesWithScores
      .filter(c => c.similarity >= minSimilarity)
      .sort((a, b) => (b.similarity * 0.7 + (1 - a.distance / maxDistance) * 0.3) - 
                      (a.similarity * 0.7 + (1 - b.distance / maxDistance) * 0.3))
      .slice(0, 3) // Top 3 candidates

    return NextResponse.json(results)

  } catch (error) {
    console.error('Error in POST /api/sales/dedupe/candidates:', error)
    return NextResponse.json([])
  }
}
