export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getOrganizerFromRequest(req: NextRequest, eventId: string) {
  const header = req.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice(7)
  if (!token) return null
  try {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error } = await anon.auth.getUser(token)
    if (error || !user) return null
    const admin = getAdminClient()
    const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
    if (!event || event.organizer_id !== user.id) return null
    return user
  } catch {
    return null
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizer = await getOrganizerFromRequest(req, params.id)
  if (!organizer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('event_volunteers')
      .select('*')
      .eq('event_id', params.id)
      .eq('status', 'active')
    if (error) throw error
    return NextResponse.json(data || [])
  } catch (error: unknown) {
    console.error('❌ Volunteers GET error:', { event_id: params.id, error: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur chargement bénévoles', details: (error as Error)?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const organizer = await getOrganizerFromRequest(req, params.id)
  if (!organizer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const supabase = getAdminClient()
    const body = await req.json()
    const { name, email, shifts = [] } = body
    const { data, error } = await supabase
      .from('event_volunteers')
      .insert([{ event_id: params.id, name, email, shifts, status: 'active' }])
      .select()
    if (error) throw error
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: unknown) {
    console.error('Volunteers POST error:', error)
    return NextResponse.json({ error: 'Erreur création bénévole' }, { status: 500 })
  }
}
