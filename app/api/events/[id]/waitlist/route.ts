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

// GET: List waitlist ordered by position
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const { data, error } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .select(`
        id,
        position,
        status,
        created_at,
        profiles:creator_id (id, full_name, email, avatar_url)
      `)
      .eq('event_id', params.id)
      .order('position', { ascending: true })

    if (error) throw error
    return NextResponse.json({ waitlist: data || [] })
  } catch (error: any) {
    console.error('❌ Waitlist GET error:', { event_id: params.id, error: error.message })
    return NextResponse.json({ error: 'Erreur chargement waitlist', details: error.message }, { status: 500 })
  }
}

// POST: Add creator to waitlist
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const admin = getAdminClient()
  try {
    const body = await req.json()
    const { creator_id, reason = 'Sold out' } = body
    if (!creator_id) return NextResponse.json({ error: 'creator_id required' }, { status: 400 })

    const { data: maxPos } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .select('position')
      .eq('event_id', params.id)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = (maxPos?.[0]?.position || 0) + 1

    const { data, error } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .insert([{ event_id: params.id, creator_id, position: nextPosition, reason, status: 'waiting' }])
      .select()

    if (error) throw error
    return NextResponse.json(data?.[0], { status: 201 })
  } catch (error: any) {
    console.error('❌ Waitlist POST error:', { event_id: params.id, error: error.message })
    return NextResponse.json({ error: 'Erreur traitement waitlist', details: error.message }, { status: 500 })
  }
}

// PATCH: Promote waitlist entry (organizer only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const body = await req.json()
    const { waitlist_id } = body
    if (!waitlist_id) return NextResponse.json({ error: 'waitlist_id required' }, { status: 400 })

    const { error } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .update({ status: 'promoted' })
      .eq('id', waitlist_id)
      .eq('event_id', params.id)

    if (error) throw error

    // Reorder remaining waiting entries
    const { data: remaining } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .select('id')
      .eq('event_id', params.id)
      .eq('status', 'waiting')
      .order('position', { ascending: true })

    for (let i = 0; i < (remaining?.length || 0); i++) {
      await (admin as any).from('event_exhibitor_waitlist').update({ position: i + 1 }).eq('id', remaining![i].id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Waitlist PATCH error:', { event_id: params.id, error: error.message })
    return NextResponse.json({ error: 'Erreur mise à jour waitlist', details: error.message }, { status: 500 })
  }
}

// DELETE: Remove from waitlist (organizer only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  const user = await requireOrganizer(req, params.id)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = getAdminClient()
  try {
    const body = await req.json()
    const { waitlist_id } = body
    if (!waitlist_id) return NextResponse.json({ error: 'waitlist_id required' }, { status: 400 })

    const { error } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .delete()
      .eq('id', waitlist_id)
      .eq('event_id', params.id)

    if (error) throw error

    // Reorder remaining
    const { data: remaining } = await (admin as any)
      .from('event_exhibitor_waitlist')
      .select('id')
      .eq('event_id', params.id)
      .eq('status', 'waiting')
      .order('position', { ascending: true })

    for (let i = 0; i < (remaining?.length || 0); i++) {
      await (admin as any).from('event_exhibitor_waitlist').update({ position: i + 1 }).eq('id', remaining![i].id)
    }

    return NextResponse.json({ success: true, remaining_count: remaining?.length })
  } catch (error: any) {
    console.error('❌ Waitlist DELETE error:', { event_id: params.id, error: error.message })
    return NextResponse.json({ error: 'Erreur suppression waitlist', details: error.message }, { status: 500 })
  }
}
