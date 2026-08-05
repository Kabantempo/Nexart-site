export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// GET /api/events/[id]/documents
// Auth: organisateur de l'événement uniquement
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminClient()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user } } = await admin.auth.getUser(authHeader.substring(7))
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Vérifier que l'user est bien l'organisateur de cet événement
    const { data: event } = await admin.from('events').select('organizer_id').eq('id', params.id).single()
    if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    if (event.organizer_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const { data, error } = await admin
      .from('event_documents')
      .select('*, creator:profiles!creator_id(full_name, email, avatar_url)')
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ documents: data })
  } catch (err) {
    console.error('[GET /api/events/[id]/documents]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
