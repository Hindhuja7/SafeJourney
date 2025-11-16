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
      // Fix for @tomtom-org/maps-sdk module resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        '@tomtom-org/maps-sdk/core': '@tomtom-org/maps-sdk/core/dist/core.es.js',
      };
      // Add resolve fallbacks for subpath exports
      config.resolve.extensionAlias = {
        ...config.resolve.extensionAlias,
        '.js': ['.js', '.mjs'],
      };
      // Ignore warnings about missing modules for client-side only packages
      config.ignoreWarnings = [
        { module: /@tomtom-org\/maps-sdk/ },
      ];
    }
    return config;
  },
}

module.exports = nextConfig