/**
 * Deduplication utilities for sales
 * Uses distance, date overlap, and trigram similarity to find potential duplicates
 */

import { createSupabaseServer } from '@/lib/supabase/server'
import { type DedupeCandidate, calculateStringSimilarity } from './dedupe-utils'

// Re-export for server-side use
export type { DedupeCandidate }

export interface DedupeOptions {
  lat: number
  lng: number
  title: string
  date_start: string
  date_end?: string
  limit?: number
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Check if two date ranges overlap
 */
function dateRangesOverlap(
  start1: string,
  end1: string | undefined,
  start2: string,
  end2: string | undefined
): boolean {
  const s1 = new Date(start1)
  const e1 = end1 ? new Date(end1) : s1
  const s2 = new Date(start2)
  const e2 = end2 ? new Date(end2) : s2

  return s1 <= e2 && s2 <= e1
}

/**
 * Find potential duplicate sales
 */
export async function findDuplicateCandidates(options: DedupeOptions): Promise<DedupeCandidate[]> {
  const { lat, lng, title, date_start, date_end, limit = 5 } = options
  
  try {
    const supabase = createSupabaseServer()
    
    // Calculate bounding box for initial filtering (±0.01 degrees ≈ 1km)
    const latRange = 0.01
    const lngRange = 0.01
    
    // Query candidates within bounding box
    const { data: candidates, error } = await supabase
      .from('yard_sales')
      .select(`
        id,
        title,
        date_start,
        date_end,
        time_start,
        time_end,
        lat,
        lng
      `)
      .gte('lat', lat - latRange)
      .lte('lat', lat + latRange)
      .gte('lng', lng - lngRange)
      .lte('lng', lng + lngRange)
      .eq('status', 'published')
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(50) // Get more candidates for filtering

    if (error) {
      console.error('Error querying candidates:', error)
      return []
    }

    if (!candidates || candidates.length === 0) {
      return []
    }

    // Filter by precise distance and date overlap
    const filteredCandidates = candidates
      .filter(candidate => {
        if (!candidate.lat || !candidate.lng) return false
        
        // Check distance (≤150m)
        const distance = calculateDistance(lat, lng, candidate.lat, candidate.lng)
        if (distance > 150) return false
        
        // Check date overlap
        if (!dateRangesOverlap(date_start, date_end, candidate.date_start, candidate.date_end)) {
          return false
        }
        
        return true
      })
      .map(candidate => {
        // Calculate similarity manually
        const similarity = calculateStringSimilarity(title, candidate.title)
        
        return {
          id: candidate.id,
          title: candidate.title,
          date_start: candidate.date_start,
          date_end: candidate.date_end,
          time_start: candidate.time_start,
          time_end: candidate.time_end,
          distance: calculateDistance(lat, lng, candidate.lat!, candidate.lng!),
          similarity: similarity,
          url: `/sale/${candidate.id}`
        }
      })
      .filter(candidate => candidate.similarity >= 0.35) // Filter by similarity threshold
      .sort((a, b) => {
        // Sort by composite score: similarity * 0.7 + distance_score * 0.3
        const aScore = a.similarity * 0.7 + (1 - Math.min(a.distance / 150, 1)) * 0.3
        const bScore = b.similarity * 0.7 + (1 - Math.min(b.distance / 150, 1)) * 0.3
        return bScore - aScore
      })
      .slice(0, limit)

    // Check for negative matches and filter them out
    if (filteredCandidates.length > 0) {
      const candidateIds = filteredCandidates.map(c => c.id)
      
      const { data: negativeMatches } = await supabase
        .from('negative_matches')
        .select('sale_id_a, sale_id_b')
        .or(`sale_id_a.in.(${candidateIds.join(',')}),sale_id_b.in.(${candidateIds.join(',')})`)
      
      if (negativeMatches) {
        const excludedIds = new Set<string>()
        negativeMatches.forEach(match => {
          excludedIds.add(match.sale_id_a)
          excludedIds.add(match.sale_id_b)
        })
        
        return filteredCandidates.filter(candidate => !excludedIds.has(candidate.id))
      }
    }

    return filteredCandidates

  } catch (error) {
    console.error('Error in findDuplicateCandidates:', error)
    return []
  }
}