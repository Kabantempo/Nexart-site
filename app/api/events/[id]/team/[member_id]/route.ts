import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireOrganizer(req: NextRequest, eventId: string) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return null
  const admin = getAdminClient()
  const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
  if (event?.organizer_id !== user.id) return null
  return user
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; member_id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })

  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const { error } = await (admin as any)
      .from('event_team')
      .delete()
      .eq('id', params.member_id)
      .eq('event_id', params.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Team DELETE error:', { event_id: params.id, member_id: params.member_id, error: error.message })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
