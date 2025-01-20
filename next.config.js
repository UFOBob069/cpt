/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'lh3.googleusercontent.com',     // Google user profile images
      'coin-images.coingecko.com',     // CoinGecko coin images
      'assets.coingecko.com',          // Alternative CoinGecko domain
      'www.coingecko.com'              // Main CoinGecko domain
    ],
  },
}

module.exports = nextConfig 