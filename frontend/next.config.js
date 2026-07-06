/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Transpile the shared workspace package
  transpilePackages: ['@placement-platform/shared'],

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  // Production optimizations
  poweredByHeader: false,
  output: 'standalone',
  productionBrowserSourceMaps: false,

  // Custom headers for caching static assets in production
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, must-revalidate',
          },
        ],
      },
    ];
  },

  // Enable experimental features
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
