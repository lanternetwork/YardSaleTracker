export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const allow = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return allow.includes(email.toLowerCase())
}

export function ensureAdminOrNotFound(email: string | null | undefined) {
  if (!isAdminEmail(email)) {
    const err: any = new Error('Not Found')
    ;(err as any).statusCode = 404
    throw err
  }
}

