export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

async function getUser(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: { user }, error } = await supabase.auth.getUser(
    req.headers.get('Authorization')?.split(' ')[1]
  )
  return error || !user ? null : user
}

async function assertOwner(admin: ReturnType<typeof getAdminClient>, groupId: string, userId: string) {
  const { data } = await (admin as any).from('message_groups').select('organizer_id').eq('id', groupId).single()
  return data?.organizer_id === userId
}

// GET: list members with profile info
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getAdminClient()
  if (!await assertOwner(admin, params.id, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: members } = await (admin as any)
    .from('message_group_members')
    .select('id, user_id, added_at')
    .eq('group_id', params.id)
    .order('added_at', { ascending: true })

  const userIds = (members ?? []).map((m: any) => m.user_id)
  let profileMap: Record<string, any> = {}
  if (userIds.length) {
    const { data: profiles } = await admin.from('profiles').select('id, full_name, avatar_url, role').in('id', userIds)
    for (const p of profiles ?? []) profileMap[p.id] = p
  }

  const enriched = (members ?? []).map((m: any) => ({ ...m, profile: profileMap[m.user_id] ?? null }))
  return NextResponse.json({ members: enriched })
}

// POST: add a member
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getAdminClient()
  if (!await assertOwner(admin, params.id, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { user_id } = await req.json()
  if (!user_id) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })

  const { data, error } = await (admin as any)
    .from('message_group_members')
    .insert({ group_id: params.id, user_id })
    .select('id, user_id, added_at')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Déjà membre' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch profile for response
  const { data: profile } = await admin.from('profiles').select('id, full_name, avatar_url, role').eq('id', user_id).single()
  return NextResponse.json({ member: { ...data, profile } }, { status: 201 })
}

// DELETE: remove a member (pass ?user_id=xxx)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const admin = getAdminClient()
  if (!await assertOwner(admin, params.id, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const user_id = req.nextUrl.searchParams.get('user_id')
  if (!user_id) return NextResponse.json({ error: 'user_id requis' }, { status: 400 })

  await (admin as any).from('message_group_members').delete().eq('group_id', params.id).eq('user_id', user_id)
  return NextResponse.json({ success: true })
}
