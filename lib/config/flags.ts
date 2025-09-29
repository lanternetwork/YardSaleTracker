// Feature flags and environment configuration
export const isStabilize = process.env.STABILIZE_MODE === '1'

// Other feature flags can be added here
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isPreview = process.env.VERCEL_ENV === 'preview'
export const isProduction = process.env.VERCEL_ENV === 'production'
