/**
 * Draft token utilities for anonymous sale drafts
 * Provides secure token generation and cookie management
 */

import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const DRAFT_SECRET = process.env.DRAFT_SECRET || 'fallback-draft-secret'

/**
 * Generate a secure random draft token
 */
export function mintDraftToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Hash a draft token for secure storage
 */
export function hashToken(token: string): string {
  return createHash('sha256')
    .update(token + DRAFT_SECRET)
    .digest('base64')
}

/**
 * Set a draft cookie for a sale
 */
export function setDraftCookie(
  response: NextResponse,
  saleId: string,
  token: string
): void {
  const cookieName = `la_draft_${saleId}`
  
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })
}

/**
 * Read a draft cookie for a sale
 */
export function readDraftCookie(
  request: NextRequest,
  saleId: string
): string | null {
  const cookieName = `la_draft_${saleId}`
  return request.cookies.get(cookieName)?.value || null
}

/**
 * Clear a draft cookie for a sale
 */
export function clearDraftCookie(
  response: NextResponse,
  saleId: string
): void {
  const cookieName = `la_draft_${saleId}`
  
  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
}

/**
 * Verify a draft token against a stored hash
 */
export async function verifyDraftToken(
  token: string,
  storedHash: string
): Promise<boolean> {
  const computedHash = hashToken(token)
  return computedHash === storedHash
}
