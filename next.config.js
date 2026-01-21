/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // Skip ALL ESLint
  },
  typescript: {
    ignoreBuildErrors: true,   // Skip ALL TypeScript
  },
  images: {
    unoptimized: true,         // Fix any image issues
  },
  experimental: {
    esmExternals: 'loose',
  },
};

module.exports = nextConfig;
