import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

async function checkAdminAccess(req: NextRequest): Promise<{ isAdmin: boolean; userId?: string }> {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { isAdmin: false }
    }

    const token = authHeader.substring(7)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return { isAdmin: false }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    return {
      isAdmin: profile?.is_admin === true,
      userId: user.id
    }
  } catch {
    return { isAdmin: false }
  }
}

export async function middleware(req: NextRequest) {
  const path = new URL(req.url).pathname

  // Admin auth check
  if (path.startsWith('/api/admin/')) {
    const { isAdmin } = await checkAdminAccess(req)
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
    for (const [k, v] of rateLimit.entries()) {
      if (v.reset <= now) rateLimit.delete(k)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
