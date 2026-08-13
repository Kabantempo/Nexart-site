import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// NOTE: In-memory rate limiting — effective only within a single process/instance.
// For multi-instance or serverless deployments, replace with Redis/Upstash.
const rateLimit = new Map<string, { count: number; reset: number }>()

const LIMITS = {
  '/api/': 100,
  '/api/auth/': 10,
  '/api/admin/': 50,
} as const

function getLimit(path: string): number {
  if (path.includes('/api/auth/')) return LIMITS['/api/auth/']
  if (path.includes('/api/admin/')) return LIMITS['/api/admin/']
  if (path.includes('/api/')) return LIMITS['/api/']
  return 1000
}

function getRateLimitKey(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const path = new URL(req.url).pathname
  return `${ip}:${path}`
}

async function checkAdminAccess(req: NextRequest): Promise<{ isAdmin: boolean; authenticated: boolean; userId?: string }> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { isAdmin: false, authenticated: false }
    }

    const token = authHeader.substring(7)
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return { isAdmin: false, authenticated: false }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return { isAdmin: false, authenticated: false }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    return {
      isAdmin: profile?.is_admin === true,
      authenticated: true,
      userId: user.id
    }
  } catch {
    return { isAdmin: false, authenticated: false }
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function middleware(req: NextRequest) {
  const path = new URL(req.url).pathname

  // Reject malformed Server Action requests missing Origin — this app defines
  // no Server Actions, so these are bots/scanners probing with a fake
  // Next-Action header. Without Origin, Next 13.5.6's internal handler
  // crashes trying to read `.message` off a null error object.
  if (req.method === 'POST' && req.headers.get('next-action') && !req.headers.get('origin')) {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Creator username → UUID rewrite
  if (path.startsWith('/creators/')) {
    const segment = path.split('/')[2]
    if (segment && !UUID_RE.test(segment)) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?username=eq.${encodeURIComponent(segment)}&role=eq.creator&select=id&limit=1`,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
              'Accept-Profile': 'public',
            },
          }
        )
        const data = await res.json()
        if (Array.isArray(data) && data[0]?.id) {
          const url = req.nextUrl.clone()
          url.pathname = `/creators/${data[0].id}`
          return NextResponse.rewrite(url)
        }
      } catch {
        // fall through to normal rendering
      }
    }
  }

  // Admin auth check
  if (path.startsWith('/api/admin/')) {
    const { isAdmin, authenticated } = await checkAdminAccess(req)
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
  }

  // Rate limiting
  if (!path.startsWith('/api/')) {
    return NextResponse.next()
  }

  const key = getRateLimitKey(req)
  const now = Date.now()
  const limit = getLimit(path)

  const record = rateLimit.get(key)
  if (record && record.reset > now) {
    if (record.count >= limit) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
    record.count++
  } else {
    rateLimit.set(key, { count: 1, reset: now + 60000 })
  }

  // Cleanup old entries every 10 requests
  if (Math.random() < 0.1) {
    Array.from(rateLimit.entries()).forEach(([k, v]) => {
      if (v.reset <= now) rateLimit.delete(k)
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/creators/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
}
