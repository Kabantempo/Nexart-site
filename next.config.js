/** @type {import('next').NextConfig} */

async function headers() {
  return [
    // HTML pages: no caching (prevent LiteSpeed from serving stale pages)
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)).*)',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        { key: 'X-LiteSpeed-Cache-Control', value: 'no-cache' },
        { key: 'X-LiteSpeed-Cache', value: 'no' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.vercel-insights.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://cvqeysnymnkfxfithhsr.supabase.co https://*.supabase.co ws: wss: https://geo.api.gouv.fr; frame-ancestors 'none'; upgrade-insecure-requests;",
        },
        { key: 'Access-Control-Allow-Origin', value: 'https://nexart.fr' },
      ],
    },
    // Static assets: cache forever (fingerprinted filenames)
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ]
}

const nextConfig = {
  output: 'standalone',
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  headers,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'cvqeysnymnkfxfithhsr.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
    minimumCacheTTL: 31536000,
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  staticPageGenerationTimeout: 120,
}

module.exports = nextConfig
