/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['jspdf'],
    serverComponentsExternalPackages: ['canvas'], // Required for canvas in Node.js environment
  },
  webpack: (config, { isServer }) => {
    // Handle canvas for server-side rendering
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push('canvas')
    }
    return config
  },
}

module.exports = nextConfig

