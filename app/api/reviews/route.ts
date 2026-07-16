export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { sendPushToUsers } from '@/lib/push'

async function getAuthUser(req: NextRequest) {
  const header = req.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) return null
  const token = header.slice(7)
  if (!token) return null
  try {
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user }, error } = await anon.auth.getUser(token)
    if (error || !user) return null
    return user
  } catch { return null }
}

// GET /api/reviews?event_id=xxx  or  ?profile_id=xxx (public)
export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const eventId = req.nextUrl.searchParams.get('event_id')
    const profileId = req.nextUrl.searchParams.get('profile_id')

    let query = admin.from('reviews').select(`
      id, event_id, reviewer_id, reviewed_id, reviewer_role, rating, comment, tags, created_at,
      reviewer:profiles!reviewer_id(full_name, avatar_url),
      reviewed:profiles!reviewed_id(full_name, avatar_url)
    `).order('created_at', { ascending: false })

    if (eventId) query = query.eq('event_id', eventId)
    else if (profileId) query = query.eq('reviewed_id', profileId)
    else return NextResponse.json({ error: 'event_id ou profile_id requis' }, { status: 400 })

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ reviews: data })
  } catch (error: any) {
    console.error('❌ Reviews GET error:', { error: error?.message })
    return NextResponse.json({ error: 'Erreur chargement avis', details: error?.message }, { status: 500 })
  }
}

// POST /api/reviews — auth requise, reviewer_id forcé à l'utilisateur connecté
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const admin = getAdminClient()
    const body = await req.json()
    const { event_id, reviewed_id, reviewer_role, rating, comment, tags } = body

    if (!event_id || !reviewed_id || !reviewer_role || !rating) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Note entre 1 et 5' }, { status: 400 })
    }

    const reviewer_id = user.id

    if (reviewer_role === 'creator') {
      const { data: app } = await admin.from('applications')
        .select('id').eq('event_id', event_id).eq('creator_id', reviewer_id).eq('status', 'accepted').maybeSingle()
      if (!app) return NextResponse.json({ error: 'Seuls les créateurs acceptés peuvent noter cet événement' }, { status: 403 })
    } else {
      const { data: ev } = await admin.from('events')
        .select('id').eq('id', event_id).eq('organizer_id', reviewer_id).maybeSingle()
      if (!ev) return NextResponse.json({ error: "Seul l'organisateur peut noter les créateurs" }, { status: 403 })
    }

    const { data, error } = await admin.from('reviews').insert({
      event_id, reviewer_id, reviewed_id, reviewer_role,
      rating, comment: comment || null, tags: tags || [],
    }).select().single()

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Vous avez déjà noté cette personne pour cet événement' }, { status: 409 })
      throw error
    }

    await admin.from('notifications').insert({
      user_id: reviewed_id,
      type: 'new_review',
      title: 'Nouvelle évaluation reçue',
      body: `Vous avez reçu une note de ${rating}/5 pour l'événement.`,
      link: `/events/${event_id}`,
    })

    await sendPushToUsers([reviewed_id], '⭐ Nouvelle évaluation', `Vous avez reçu une note de ${rating}/5`, `/events/${event_id}`)

    console.log('✓ Review created:', { reviewer_id, reviewed_id, rating })
    return NextResponse.json({ review: data }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Reviews POST error:', { error: error?.message })
    return NextResponse.json({ error: 'Erreur création avis', details: error?.message }, { status: 500 })
  }
}
