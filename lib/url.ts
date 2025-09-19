import { ENV_PUBLIC } from './env'

export const siteUrl = ENV_PUBLIC.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3000'

export const getRedirectUrl = (path: string = '') => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${siteUrl}${cleanPath}`
}
