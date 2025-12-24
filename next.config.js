/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure static files are properly served
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Disable static optimization for development to avoid cache issues
  experimental: {
    optimizePackageImports: ['jspdf'],
  },
}

module.exports = nextConfig

