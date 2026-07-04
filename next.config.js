/** @type {import('next').NextConfig} */

async function headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), microphone=(), camera=()',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains; preload',
        },
        {
          key: 'Content-Security-Policy',
          value: process.env.NODE_ENV === 'development'
            ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.vercel-insights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://cvqeysnymnkfxfithhsr.supabase.co https://*.supabase.co ws: wss: https://geo.api.gouv.fr; frame-ancestors 'none';"
            : "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.vercel-insights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://cvqeysnymnkfxfithhsr.supabase.co https://*.supabase.co https://geo.api.gouv.fr; frame-ancestors 'none'; upgrade-insecure-requests;",
        },
      ],
    },
  ]
}

const nextConfig = {
  output: 'standalone',
  experimental: {
    cpus: 1,
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
}

module.exports = nextConfig
