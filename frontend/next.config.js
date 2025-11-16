// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: true
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  webpack: (config, { isServer }) => {
    // Handle @tomtom-org/maps-sdk subpath exports
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
      // Add resolve fallbacks for subpath exports
      config.resolve.extensionAlias = {
        ...config.resolve.extensionAlias,
        '.js': ['.js', '.mjs'],
      };
    }
    return config;
  },
}

module.exports = nextConfig