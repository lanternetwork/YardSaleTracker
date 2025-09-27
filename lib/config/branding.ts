/**
 * Centralized branding configuration for LootAura
 * 
 * This module centralizes all brand-related strings to prevent drift
 * and enable easy customization via environment variables.
 */

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'LootAura'
export const APP_TAGLINE = 'Find and share yard sales in your neighborhood'
export const COMPANY_NAME = 'LootAura'

// PWA specific branding
export const PWA_NAME = APP_NAME
export const PWA_SHORT_NAME = APP_NAME

// SEO metadata
export const DEFAULT_TITLE = `${APP_NAME} - ${APP_TAGLINE}`
export const DEFAULT_DESCRIPTION = `Discover yard sales, garage sales, and estate sales near you with ${APP_NAME}. Post your own sales and connect with your community.`
