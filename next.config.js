/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'assets.coingecko.com',
      'coin-images.coingecko.com',
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com'
    ],
  },
  experimental: {
    appDir: true,
  },
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TS errors during build
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporarily ignore ESLint errors during build
  },
}

module.exports = nextConfig 