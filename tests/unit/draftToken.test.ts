import { describe, it, expect } from 'vitest'
import { mintDraftToken, hashToken, verifyDraftToken } from '@/lib/server/draftToken'

describe('Draft Token Utilities', () => {
  describe('mintDraftToken', () => {
    it('should generate a random token', () => {
      const token = mintDraftToken()
      expect(token).toBeDefined()
      expect(token.length).toBe(64) // 32 bytes = 64 hex chars
    })

    it('should generate unique tokens', () => {
      const token1 = mintDraftToken()
      const token2 = mintDraftToken()
      expect(token1).not.toBe(token2)
    })
  })

  describe('hashToken', () => {
    it('should hash a token consistently', () => {
      const token = 'test-token-123'
      const hash1 = hashToken(token)
      const hash2 = hashToken(token)
      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different tokens', () => {
      const token1 = 'test-token-123'
      const token2 = 'test-token-456'
      const hash1 = hashToken(token1)
      const hash2 = hashToken(token2)
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyDraftToken', () => {
    it('should verify correct token', async () => {
      const token = 'test-token-123'
      const hash = hashToken(token)
      const isValid = await verifyDraftToken(token, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect token', async () => {
      const token = 'test-token-123'
      const wrongToken = 'wrong-token-456'
      const hash = hashToken(token)
      const isValid = await verifyDraftToken(wrongToken, hash)
      expect(isValid).toBe(false)
    })

    it('should reject empty token', async () => {
      const token = 'test-token-123'
      const hash = hashToken(token)
      const isValid = await verifyDraftToken('', hash)
      expect(isValid).toBe(false)
    })
  })

  describe('token roundtrip', () => {
    it('should work with mint and verify', async () => {
      const token = mintDraftToken()
      const hash = hashToken(token)
      const isValid = await verifyDraftToken(token, hash)
      expect(isValid).toBe(true)
    })
  })
})
