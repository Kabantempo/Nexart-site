export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = req.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error: authError } = await anon.auth.getUser(auth.slice(7))
    if (authError || !user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 })

    const admin = getAdminClient()
    const eventId = params.id

    // Verify requester is the organizer
    const { data: event } = await admin.from('events').select('organizer_id').eq('id', eventId).single()
    if (!event || event.organizer_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const status = req.nextUrl.searchParams.get('status')

    let query = admin
      .from('applications')
      .select('id, creator_id, event_id, message, status, created_at, boosted_at, profiles(full_name, avatar_url, bio)')
      .eq('event_id', eventId)
      .order('boosted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status as 'pending' | 'accepted' | 'refused')

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ applications: data })
  } catch (error: unknown) {
    console.error('❌ GET /api/events/[id]/applications:', (error as Error)?.message)
    return NextResponse.json({ error: 'Erreur serveur', details: (error as Error)?.message }, { status: 500 })
  }
}
