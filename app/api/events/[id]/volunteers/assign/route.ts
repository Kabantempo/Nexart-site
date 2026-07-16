export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function requireOrganizer(req: NextRequest, eventId: string) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  if (!token) return null
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data: { user } } = await anon.auth.getUser(token)
  if (!user) return null
  const admin = getAdminClient()
  const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
  if (event?.organizer_id !== user.id) return null
  return user
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })

  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { assignments } = await req.json() as { assignments: { shift_id: string; volunteer_id: string }[] }
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return NextResponse.json({ error: 'No assignments provided' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Clear existing assignments for these shifts
    const shiftIds = [...new Set(assignments.map(a => a.shift_id))]
    await (supabase as any).from('volunteer_assignments').delete().in('shift_id', shiftIds)

    // Insert new assignments
    const { error } = await (supabase as any).from('volunteer_assignments').insert(assignments)
    if (error) throw error

    // Update assigned counts on shifts
    for (const shiftId of shiftIds) {
      const count = assignments.filter(a => a.shift_id === shiftId).length
      await supabase.from('event_shifts').update({ assigned: count }).eq('id', shiftId)
    }

    return NextResponse.json({ success: true, count: assignments.length })
  } catch (error: unknown) {
    console.error('❌ Assign volunteers error:', (error as Error)?.message)
    return NextResponse.json({ error: 'Erreur assignation bénévoles' }, { status: 500 })
  }
}
