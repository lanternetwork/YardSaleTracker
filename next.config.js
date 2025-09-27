/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['react-virtuoso'],
  },
  // Enable static optimization for better performance
  // output: 'standalone', // Commented out to fix static generation issues
  // Compress responses
  compress: true,
  // Enable SWC minification
  swcMinify: true,
  // Content Security Policy
  async headers() {
    const isPreview = process.env.VERCEL_ENV === 'preview'
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              // Google Maps
              "https://maps.googleapis.com",
              "https://maps.gstatic.com",
              // Supabase
              "https://*.supabase.co",
              "https://*.supabase.com",
              // Vercel Live (preview only)
              ...(isPreview ? ["https://vercel.live"] : []),
              // Development
              ...(isDevelopment ? ["'unsafe-eval'"] : []),
              "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.supabase.co https://*.supabase.com wss://*.supabase.co",
              // Vercel Live (preview only)
              ...(isPreview ? ["https://vercel.live", "wss://vercel.live"] : []),
              "img-src 'self' data: blob:",
              // Supabase storage
              "https://*.supabase.co",
              "https://*.supabase.in",
              // Google Maps
              "https://maps.googleapis.com",
              "https://maps.gstatic.com",
              "https://storage.googleapis.com",
              "style-src 'self' 'unsafe-inline'",
              // Google Fonts
              "https://fonts.googleapis.com",
              "font-src 'self'",
              // Google Fonts
              "https://fonts.gstatic.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
