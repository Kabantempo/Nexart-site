export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const admin = getAdminClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    req.headers.get('Authorization')?.split(' ')[1]
  )
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: groups, error } = await admin
    .from('message_groups')
    .select('id, name, event_id, created_at, events(title, slug)')
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get member counts
  const groupIds = (groups ?? []).map((g: any) => g.id)
  let countMap: Record<string, number> = {}
  if (groupIds.length) {
    const { data: members } = await admin
      .from('message_group_members')
      .select('group_id')
      .in('group_id', groupIds)
    for (const m of members ?? []) {
      countMap[m.group_id] = (countMap[m.group_id] ?? 0) + 1
    }
  }

  const enriched = (groups ?? []).map((g: any) => ({
    ...g,
    memberCount: countMap[g.id] ?? 0,
  }))

  return NextResponse.json({ groups: enriched })
}

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const admin = getAdminClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    req.headers.get('Authorization')?.split(' ')[1]
  )
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, event_id, auto_import } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Nom requis' }, { status: 400 })

  // Verify organizer owns the event if provided
  if (event_id) {
    const { data: ev } = await admin.from('events').select('organizer_id').eq('id', event_id).single()
    if (ev?.organizer_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: group, error } = await admin
    .from('message_groups')
    .insert({ name: name.trim(), organizer_id: user.id, event_id: event_id ?? null })
    .select('id, name, event_id, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-import accepted/confirmed applicants from the event
  if (auto_import && event_id && group) {
    const { data: apps } = await admin
      .from('applications')
      .select('creator_id')
      .eq('event_id', event_id)
      .in('status', ['accepted', 'confirmed', 'awaiting_payment', 'paid'])

    if (apps?.length) {
      const members = apps.map((a: any) => ({ group_id: group.id, user_id: a.creator_id }))
      await admin.from('message_group_members').insert(members).select()
    }
  }

  return NextResponse.json({ group, memberCount: 0 }, { status: 201 })
}
