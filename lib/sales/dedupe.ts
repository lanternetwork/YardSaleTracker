// Deduplication utilities for sales

import { createSupabaseServer } from '@/lib/supabase/server'

export interface Sale {
  id: string
  title: string
  lat?: number
  lng?: number
  date_start?: string
  date_end?: string
  time_start?: string
  time_end?: string
  [key: string]: any
}

export interface DedupeCandidate {
  sale: Sale
  distance: number // in meters
  similarity: number // trigram similarity score
  reason: string
}

/**
 * Calculates distance between two points using Haversine formula
 * @param lat1 - First latitude
 * @param lng1 - First longitude
 * @param lat2 - Second latitude
 * @param lng2 - Second longitude
 * @returns Distance in meters
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lng2 - lng1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Checks if two date ranges overlap
 * @param start1 - First start date
 * @param end1 - First end date
 * @param start2 - Second start date
 * @param end2 - Second end date
 * @returns true if ranges overlap
 */
export function dateRangesOverlap(
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
 * Finds potential duplicate candidates for a new sale
 * @param newSale - The new sale to check
 * @returns Array of potential duplicates
 */
export async function findDuplicateCandidates(newSale: Sale): Promise<DedupeCandidate[]> {
  if (!newSale.lat || !newSale.lng || !newSale.title || !newSale.date_start) {
    return []
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
    return []
  }

  if (!candidates || candidates.length === 0) {
    return []
  }

  // Filter by exact distance and date overlap
  const validCandidates = candidates.filter(candidate => {
    if (!candidate.lat || !candidate.lng || !candidate.date_start) {
      return false
    }

    const distance = calculateDistance(
      newSale.lat, newSale.lng,
      candidate.lat, candidate.lng
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
      candidate.lat, candidate.lng
    )

    // Use PostgreSQL trigram similarity (we'll need to implement this in the query)
    // For now, use a simple string similarity
    const similarity = calculateStringSimilarity(newSale.title, candidate.title)

    return {
      sale: candidate,
      distance,
      similarity,
      reason: `Distance: ${Math.round(distance)}m, Similarity: ${(similarity * 100).toFixed(1)}%`
    }
  })

  // Filter by minimum similarity and sort by score
  return candidatesWithScores
    .filter(c => c.similarity >= minSimilarity)
    .sort((a, b) => (b.similarity * 0.7 + (1 - a.distance / maxDistance) * 0.3) - 
                    (a.similarity * 0.7 + (1 - b.distance / maxDistance) * 0.3))
    .slice(0, 3) // Top 3 candidates
}

/**
 * Simple string similarity calculation (fallback when trigram not available)
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()
  
  if (s1 === s2) return 1
  
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

/**
 * Records a negative match (user confirmed two sales are NOT duplicates)
 * @param saleIdA - First sale ID
 * @param saleIdB - Second sale ID
 * @param userId - User who made the decision
 * @returns Success status
 */
export async function recordNegativeMatch(
  saleIdA: string, 
  saleIdB: string, 
  userId?: string
): Promise<boolean> {
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
    return false
  }

  return true
}

/**
 * Checks if a negative match exists between two sales
 * @param saleIdA - First sale ID
 * @param saleIdB - Second sale ID
 * @returns true if negative match exists
 */
export async function hasNegativeMatch(saleIdA: string, saleIdB: string): Promise<boolean> {
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
    return false
  }

  return !!data
}
