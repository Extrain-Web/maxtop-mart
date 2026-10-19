import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Compiler is disabled: with it on, Suspense-wrapped pages could get
  // stuck on their fallback/loading state (Next 16.1.2 + React 19). Leave off
  // until that interaction is resolved upstream.
  reactCompiler: false,
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  // Tree-shake large icon/animation libs so pages ship far less JS.
  experimental: {
    optimizePackageImports: ['react-icons', 'framer-motion'],
  },
  images: {
    // Serve modern formats and cache optimized variants for a month so the
    // self-hosted optimizer doesn't re-process the same image on every visit.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.kwcdn.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      // Locally-stored uploads served by the backend (disk-storage mode).
      // Local dev: backend runs on http://localhost:5000.
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
      },
      {
        protocol: "http",
        hostname: "api.maxtopmartbd.com",
      },
      {
        protocol: "https",
        hostname: "api.maxtopmartbd.com",
      },
      // Production API (disk-stored uploads served by the backend).
      {
        protocol: "https",
        hostname: "api.maxtopmart.com",
      },
      {
        protocol: "http",
        hostname: "api.maxtopmart.com",
      },
    ],
  },
};

export default nextConfig;
