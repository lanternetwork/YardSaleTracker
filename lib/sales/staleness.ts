export type SaleStatus = 'active' | 'stale' | 'removed'

export function nextStatus(lastSeenAtIso: string): SaleStatus {
  const last = new Date(lastSeenAtIso).getTime()
  const now = Date.now()
  const diffHrs = (now - last) / (1000 * 60 * 60)
  if (diffHrs >= 24 * 7) return 'removed'
  if (diffHrs >= 72) return 'stale'
  return 'active'
}


