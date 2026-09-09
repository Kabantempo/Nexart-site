export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const admin = getAdminClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    req.headers.get('Authorization')?.split(' ')[1]
  )
  if (authErr || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Message requis' }, { status: 400 })

  // Verify organizer owns the group
  const { data: group } = await admin
    .from('message_groups')
    .select('id, organizer_id, event_id')
    .eq('id', params.id)
    .single()

  if (!group || group.organizer_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get all members
  const { data: members } = await admin
    .from('message_group_members')
    .select('user_id')
    .eq('group_id', params.id)

  if (!members?.length) return NextResponse.json({ error: 'Aucun membre dans ce groupe' }, { status: 400 })

  let sent = 0
  for (const member of members) {
    // Find or create conversation between organizer and member
    const { data: existing } = await admin
      .from('conversations')
      .select('id')
      .eq('organizer_id', user.id)
      .eq('creator_id', member.user_id)
      .maybeSingle()

    let convId: string
    if (existing) {
      convId = existing.id
    } else {
      const { data: newConv } = await admin
        .from('conversations')
        .insert({
          organizer_id: user.id,
          creator_id: member.user_id,
          event_id: group.event_id ?? null,
        })
        .select('id')
        .single()
      if (!newConv) continue
      convId = newConv.id
    }

    await admin.from('messages').insert({
      conversation_id: convId,
      sender_id: user.id,
      content: message.trim(),
    })
    sent++
  }

  return NextResponse.json({ sent })
}
