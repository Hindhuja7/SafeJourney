/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Enable PWA features
  images: {
    domains: ['cdnjs.cloudflare.com'],
  },
}

module.exports = nextConfig

