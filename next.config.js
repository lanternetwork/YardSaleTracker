/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/hero.jpg',
        destination: '/icons/icon-512.png',
        permanent: false,
      },
    ]
  },
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
    // Enable modern module system
    esmExternals: 'loose',
    // Fix module system issues
    serverComponentsExternalPackages: [],
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
        // Optimize for large string handling
        maxMemoryGenerations: 1,
        memoryCacheUnaffected: true,
      }
      
      // Fix module resolution for Next.js compatibility
      config.resolve = {
        ...config.resolve,
        extensionAlias: {
          '.js': ['.js', '.ts', '.tsx'],
        },
        // Ensure proper module resolution
        fullySpecified: false,
      }
      
      // Fix module system conflicts
      config.module = {
        ...config.module,
        rules: [
          ...config.module.rules,
          {
            test: /\.m?js$/,
            resolve: {
              fullySpecified: false,
            },
          },
        ],
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
