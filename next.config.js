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
  // Content Security Policy is handled in middleware.ts
}

module.exports = nextConfig
