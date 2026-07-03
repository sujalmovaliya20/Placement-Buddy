/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Transpile the shared workspace package
  transpilePackages: ['@placement-platform/shared'],

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Production optimizations
  poweredByHeader: false,

  // Enable experimental features
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
