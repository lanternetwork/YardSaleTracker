// Client-side deduplication utilities for sales

import { Sale, DedupeCandidate } from './dedupe-utils'

/**
 * Finds potential duplicate candidates for a new sale (client-side)
 * @param newSale - The new sale to check
 * @returns Array of potential duplicates
 */
export async function findDuplicateCandidates(newSale: Sale): Promise<DedupeCandidate[]> {
  if (!newSale.lat || !newSale.lng || !newSale.title || !newSale.date_start) {
    return []
  }

  try {
    const response = await fetch('/api/sales/dedupe/candidates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newSale)
    })

    if (!response.ok) {
      console.error('Error fetching candidates:', response.statusText)
      return []
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching candidates:', error)
    return []
  }
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
  try {
    const response = await fetch('/api/sales/dedupe/negative-match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        saleIdA,
        saleIdB,
        userId
      })
    })

    return response.ok
  } catch (error) {
    console.error('Error recording negative match:', error)
    return false
  }
}

/**
 * Checks if a negative match exists between two sales
 * @param saleIdA - First sale ID
 * @param saleIdB - Second sale ID
 * @returns true if negative match exists
 */
export async function hasNegativeMatch(saleIdA: string, saleIdB: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/sales/dedupe/negative-match?${new URLSearchParams({
      saleIdA,
      saleIdB
    })}`)

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.exists
  } catch (error) {
    console.error('Error checking negative match:', error)
    return false
  }
}
