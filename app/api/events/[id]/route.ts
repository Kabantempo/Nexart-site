export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  } catch (error: any) {
    console.error('❌ Event GET error:', { id: params.id, error: error?.message })
    return NextResponse.json({ error: 'Erreur chargement événement', details: error?.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()
    const body = await req.json()

    const { data, error } = await admin
      .from('events')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ event: data })
  } catch (error: any) {
    console.error('❌ Event PUT error:', { id: params.id, error: error?.message })
    return NextResponse.json({ error: 'Erreur mise à jour événement', details: error?.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
  try {
    const admin = getAdminClient()

    const { error } = await admin
      .from('events')
      .delete()
      .eq('id', params.id)

    if (error) throw error
    return NextResponse.json({ message: 'Event deleted' })
  } catch (error: any) {
    console.error('❌ Event DELETE error:', { id: params.id, error: error?.message })
    return NextResponse.json({ error: 'Erreur suppression événement', details: error?.message }, { status: 500 })
  }
}
