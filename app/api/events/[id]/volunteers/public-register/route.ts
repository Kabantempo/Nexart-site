export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })

  try {
    const { name, email, shifts: shiftIds } = await req.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Nom et email requis' }, { status: 400 })
    }
    if (!Array.isArray(shiftIds) || shiftIds.length === 0) {
      return NextResponse.json({ error: 'Sélectionnez au moins un créneau' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Check event exists
    const { data: event } = await supabase.from('events').select('id, title').eq('id', params.id).single()
    if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })

    // Check if already registered (by email + event)
    const { data: existing } = await supabase
      .from('event_volunteers')
      .select('id')
      .eq('event_id', params.id)
      .eq('email', email.trim())
      .single()

    let volunteerId: string

    if (existing) {
      volunteerId = existing.id
    } else {
      const { data: newVol, error: volError } = await supabase
        .from('event_volunteers')
        .insert({ event_id: params.id, name: name.trim(), email: email.trim(), status: 'active' })
        .select('id')
        .single()
      if (volError || !newVol) throw volError || new Error('Failed to create volunteer')
      volunteerId = newVol.id
    }

    return NextResponse.json({ success: true, volunteer_id: volunteerId })
  } catch (error: unknown) {
    console.error('❌ Public register error:', (error as Error)?.message)
    return NextResponse.json({ error: 'Erreur inscription bénévole' }, { status: 500 })
  }
}
