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
  webpack: (config, { dev, isServer }) => {
    // Optimize webpack cache for better performance
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        // Use Buffer for large strings to improve performance
        compression: 'gzip',
      }
    }
    return config
  },
  // Enable static optimization for better performance
  output: 'standalone',
  // Compress responses
  compress: true,
  // Enable SWC minification
  swcMinify: true,
}

module.exports = nextConfig
