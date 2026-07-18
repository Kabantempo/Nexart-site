export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const { data: { user } } = await getAdminClient().auth.getUser(authHeader.substring(7))
  return user ?? null
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()

    const { data, error } = await admin
      .from('events')
      .select(`
        id, title, description, event_type, theme, location, city, region,
        start_date, end_date, stand_count, stand_price, cover_image,
        organizer_id, organizer:profiles!organizer_id(id, full_name, avatar_url),
        created_at
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    return NextResponse.json({ event: data })
  } catch (error: unknown) {
    console.error('❌ Event GET error:', { id: params.id, error: (error instanceof Error ? error.message : String(error)) })
    return NextResponse.json({ error: 'Erreur chargement événement' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const admin = getAdminClient()

    // Vérifier que l'utilisateur est l'organisateur de l'événement
    const { data: event } = await admin.from('events').select('organizer_id').eq('id', params.id).single()
    if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    if (event.organizer_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const { validate: v, eventCreateSchema } = await import('@/lib/validate')
    const { data: body, error: validErr } = v(eventCreateSchema.partial(), await req.json())
    if (validErr) return validErr

    const { data, error } = await admin
      .from('events')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ event: data })
  } catch (error: unknown) {
    console.error('❌ Event PUT error:', { id: params.id, error: (error instanceof Error ? error.message : String(error)) })
    return NextResponse.json({ error: 'Erreur mise à jour événement' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const admin = getAdminClient()

    // Vérifier que l'utilisateur est l'organisateur de l'événement
    const { data: event } = await admin.from('events').select('organizer_id').eq('id', params.id).single()
    if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    if (event.organizer_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const { error } = await admin
      .from('events')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ message: 'Event deleted' })
  } catch (error: unknown) {
    console.error('❌ Event DELETE error:', { id: params.id, error: (error instanceof Error ? error.message : String(error)) })
    return NextResponse.json({ error: 'Erreur suppression événement' }, { status: 500 })
  }
}
