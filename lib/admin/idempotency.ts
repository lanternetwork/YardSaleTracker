// Simple in-memory idempotency tracker (24h TTL)
// For production, consider moving to Redis or a dedicated KV table

type Entry = { expiresAt: number }

const store = new Map<string, Entry>()

export function purgeExpired(): void {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(key)
    }
  }
}

export function checkAndSetIdempotency(key: string | null | undefined, ttlMs = 24 * 60 * 60 * 1000): 'missing' | 'replay' | 'accepted' {
  purgeExpired()
  if (!key || key.length < 6) return 'missing'
  const now = Date.now()
  const existing = store.get(key)
  if (existing && existing.expiresAt > now) {
    return 'replay'
  }
  store.set(key, { expiresAt: now + ttlMs })
  return 'accepted'
}


