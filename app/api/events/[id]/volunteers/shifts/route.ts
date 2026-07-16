export const dynamic = 'force-dynamic'
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('event_shifts')
      .select('*')
      .eq('event_id', params.id)
      .order('date', { ascending: true })

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('❌ Shifts GET error:', { event_id: params.id, error: error?.message })
    return NextResponse.json({ error: 'Erreur chargement créneaux', details: error?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const supabase = getAdminClient()
    const body = await req.json()
    const { name, start_time, end_time, max_volunteers, date, time, capacity, role } = body

    const shiftDate = date || (start_time ? start_time.split('T')[0] : null)
    const shiftTime = time || (start_time ? start_time.split('T')[1]?.slice(0, 5) : null)
    const shiftCapacity = capacity || parseInt(max_volunteers) || 5
    const shiftRole = role || name || null

    const { data, error } = await supabase
      .from('event_shifts')
      .insert([{ event_id: params.id, date: shiftDate, time: shiftTime, capacity: shiftCapacity, role: shiftRole, assigned: 0 }])
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: any) {
    console.error('Shifts POST error:', error)
    return NextResponse.json({ error: 'Erreur création créneau' }, { status: 500 })
  }
}
