export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function getAuthedUser(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(
    req.headers.get('Authorization')?.split(' ')[1]
  )
  return error || !user ? null : user
}

async function canAccess(admin: ReturnType<typeof getAdminClient>, eventId: string, userId: string) {
  const [{ data: asOrg }, { data: asApp }] = await Promise.all([
    admin.from('events').select('id').eq('id', eventId).eq('organizer_id', userId).maybeSingle(),
    admin.from('applications').select('id').eq('event_id', eventId).eq('creator_id', userId)
      .in('status', ['accepted', 'confirmed', 'awaiting_payment', 'paid']).maybeSingle(),
  ])
  return !!(asOrg || asApp)
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthedUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getAdminClient()
  if (!await canAccess(admin, params.id, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: posts, error } = await admin
    .from('actu_posts')
    .select('id, content, created_at, author_id')
    .eq('event_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const authorIds = [...new Set((posts ?? []).map((p: any) => p.author_id))]
  let profileMap: Record<string, any> = {}
  if (authorIds.length) {
    const { data: profiles } = await admin.from('profiles').select('id, full_name, avatar_url, role').in('id', authorIds)
    for (const p of profiles ?? []) profileMap[p.id] = p
  }

  const enriched = (posts ?? []).map((p: any) => ({ ...p, author: profileMap[p.author_id] ?? null }))
  return NextResponse.json({ posts: enriched })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthedUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getAdminClient()
  if (!await canAccess(admin, params.id, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Contenu requis' }, { status: 400 })
  if (content.length > 2000) return NextResponse.json({ error: 'Trop long (max 2000 car.)' }, { status: 400 })

  const { data: post, error } = await admin
    .from('actu_posts')
    .insert({ event_id: params.id, author_id: user.id, content: content.trim() })
    .select('id, content, created_at, author_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: author } = await admin.from('profiles').select('id, full_name, avatar_url, role').eq('id', user.id).single()
  return NextResponse.json({ post: { ...post, author } }, { status: 201 })
}
