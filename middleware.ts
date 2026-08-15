import { NextRequest, NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function middleware(req: NextRequest) {
  const path = new URL(req.url).pathname

  // Reject malformed Server Action requests
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
        // fall through
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/creators/:path*', '/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
