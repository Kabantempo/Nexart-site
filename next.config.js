/** @type {import('next').NextConfig} */

async function headers() {
  const isDev = process.env.NODE_ENV !== 'production'
  // Next.js dev mode (Fast Refresh / webpack eval source maps) needs 'unsafe-eval'
  // to execute client chunks — without it, scripts fail silently and the UI half-breaks.
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline' https://cdn.vercel-insights.com https://www.googletagmanager.com"

  return [
    // HTML pages: no caching (prevent LiteSpeed from serving stale pages)
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp|woff2?)).*)',
      headers: [
        { key: 'Content-Type', value: 'text/html; charset=utf-8' },
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
          value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://cvqeysnymnkfxfithhsr.supabase.co https://*.supabase.co ws: wss: https://geo.api.gouv.fr; frame-ancestors 'none'; upgrade-insecure-requests;`,
        },
        { key: 'Access-Control-Allow-Origin', value: 'https://nexart.fr' },
      ],
    },
    // Static assets: cache forever (fingerprinted filenames — prod only).
    // In dev, chunk filenames aren't content-hashed, so immutable caching
    // makes the browser keep serving old JS/CSS forever after code changes.
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: isDev ? 'no-store, must-revalidate' : 'public, max-age=31536000, immutable' },
      ],
    },
  ]
}

// Fixes Next.js 13.5.6 hybrid Pages+App Router chunk resolution:
// App Router puts shared chunks in server/chunks/XXXX.js but Pages Router
// webpack-runtime expects them at server/XXXX.js — copy after emit to bridge the gap.
class CopyServerChunksPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('CopyServerChunksPlugin', (compilation, callback) => {
      const fs = require('fs')
      const path = require('path')
      const chunksDir = path.join(compiler.outputPath, 'chunks')
      try {
        if (fs.existsSync(chunksDir)) {
          for (const file of fs.readdirSync(chunksDir)) {
            if (/^\d+\.js$/.test(file)) {
              const dest = path.join(compiler.outputPath, file)
              if (!fs.existsSync(dest)) {
                fs.copyFileSync(path.join(chunksDir, file), dest)
              }
            }
          }
        }
      } catch (_) {}
      callback()
    })
  }
}

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  experimental: {
    ...(process.env.NODE_ENV === 'production' && { cpus: 1 }),
    workerThreads: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) config.plugins.push(new CopyServerChunksPlugin())
    return config
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
staticPageGenerationTimeout: 120,
typescript: { ignoreBuildErrors: true },
eslint: { ignoreDuringBuilds: true },
}

module.exports = nextConfig
