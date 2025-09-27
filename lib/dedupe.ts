/**
 * Dedupe functionality for sales
 * Implements distance + trigram similarity checking
 */

export interface SaleCandidate {
  id: string
  title: string
  address: string
  lat: number
  lng: number
  date_start: string
  date_end?: string
}

export interface DuplicateCandidate {
  id: string
  title: string
  address: string
  distance: number
  similarity: number
}

/**
 * Find potential duplicates for a sale
 */
export async function findDuplicates(
  sale: SaleCandidate,
  candidates: SaleCandidate[],
  options: {
    maxDistance: number // in meters
    minSimilarity: number // 0-1
    maxResults: number
  } = {
    maxDistance: 150, // 150m
    minSimilarity: 0.35,
    maxResults: 3
  }
): Promise<DuplicateCandidate[]> {
  const duplicates: DuplicateCandidate[] = []
  
  for (const candidate of candidates) {
    if (candidate.id === sale.id) continue
    
    // Check date overlap
    if (!hasDateOverlap(sale, candidate)) continue
    
    // Check distance
    const distance = calculateDistance(
      sale.lat, sale.lng,
      candidate.lat, candidate.lng
    )
    
    if (distance > options.maxDistance) continue
    
    // Check title similarity
    const similarity = calculateSimilarity(sale.title, candidate.title)
    
    if (similarity >= options.minSimilarity) {
      duplicates.push({
        id: candidate.id,
        title: candidate.title,
        address: candidate.address,
        distance: Math.round(distance),
        similarity: Math.round(similarity * 100) / 100
      })
    }
  }
  
  // Sort by similarity (highest first) and return top results
  return duplicates
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, options.maxResults)
}

/**
 * Check if two sales have overlapping dates
 */
export function hasDateOverlap(sale1: SaleCandidate, sale2: SaleCandidate): boolean {
  const start1 = new Date(sale1.date_start)
  const end1 = new Date(sale1.date_end || sale1.date_start)
  const start2 = new Date(sale2.date_start)
  const end2 = new Date(sale2.date_end || sale2.date_start)
  
  // Check if date ranges overlap
  return start1 <= end2 && start2 <= end1
}

/**
 * Calculate distance between two points in meters
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Calculate similarity between two strings using trigram approach
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim()
  const s2 = str2.toLowerCase().trim()
  
  if (s1 === s2) return 1
  
  // Simple word-based similarity
  const words1 = s1.split(/\s+/).filter(w => w.length > 2)
  const words2 = s2.split(/\s+/).filter(w => w.length > 2)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  const commonWords = words1.filter(word => words2.includes(word))
  const totalWords = new Set([...words1, ...words2]).size
  
  return commonWords.length / totalWords
}

/**
 * Check if a negative match exists for two sales
 */
export async function hasNegativeMatch(
  saleIdA: string,
  saleIdB: string,
  supabase: any
): Promise<boolean> {
  const { data } = await supabase
    .from('negative_matches')
    .select('id')
    .or(`and(sale_id_a.eq.${saleIdA},sale_id_b.eq.${saleIdB}),and(sale_id_a.eq.${saleIdB},sale_id_b.eq.${saleIdA})`)
    .limit(1)
  
  return data && data.length > 0
}

/**
 * Create a negative match between two sales
 */
export async function createNegativeMatch(
  saleIdA: string,
  saleIdB: string,
  userId: string,
  supabase: any
): Promise<void> {
  await supabase
    .from('negative_matches')
    .insert({
      sale_id_a: saleIdA,
      sale_id_b: saleIdB,
      created_by: userId
    })
}
