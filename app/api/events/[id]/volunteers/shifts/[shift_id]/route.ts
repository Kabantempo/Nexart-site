export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string; shift_id: string } }) {
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const supabase = getAdminClient()
    const { error } = await supabase.from('event_shifts').delete()
      .eq('id', params.shift_id).eq('event_id', params.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('DELETE /volunteers/shifts/[shift_id]:', err)
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
