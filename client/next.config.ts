import type { NextConfig } from "next";

/**
 * Pure ESM default export — avoid `import.meta` / `__dirname` here; Next’s config
 * compiler on Vercel can otherwise emit `exports` in an ESM context and fail the build.
 * `process.cwd()` is the app root at build time (set Vercel “Root Directory” to `client`).
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
