/**
 * Admin access helper for preview-only public admin mode
 * Only allows bypass in Vercel Preview environment when explicitly enabled
 */

export function allowPublicAdmin(): boolean {
  // Only allow in Vercel Preview environment
  if (process.env.VERCEL_ENV !== 'preview') {
    return false
  }
  
  // Only allow when explicitly enabled
  if (process.env.ENABLE_PUBLIC_ADMIN !== '1') {
    return false
  }
  
  return true
}

/**
 * Check if we're currently in public admin mode
 * Used for UI display purposes
 */
export function isPublicAdminMode(): boolean {
  return allowPublicAdmin()
}
