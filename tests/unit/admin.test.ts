import { describe, it, expect } from 'vitest'
import { isAdminEmail } from '@/lib/security/admin'

describe('isAdminEmail', () => {
  const OLD = process.env.ADMIN_EMAILS
  it('returns true when email is in allowlist', () => {
    process.env.ADMIN_EMAILS = 'alice@example.com,bob@example.com'
    expect(isAdminEmail('alice@example.com')).toBe(true)
    expect(isAdminEmail('BOB@example.com')).toBe(true)
  })
  it('returns false otherwise', () => {
    process.env.ADMIN_EMAILS = 'alice@example.com'
    expect(isAdminEmail('')).toBe(false)
    expect(isAdminEmail(null as any)).toBe(false)
    expect(isAdminEmail('carol@example.com')).toBe(false)
  })
  afterAll(() => {
    process.env.ADMIN_EMAILS = OLD
  })
})


