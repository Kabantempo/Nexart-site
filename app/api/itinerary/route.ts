export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

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

// GET /api/itinerary?creator_id=xxx  or  ?region=xxx (public)
export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const creatorId = req.nextUrl.searchParams.get('creator_id')
    const region = req.nextUrl.searchParams.get('region')

    let query = admin.from('itinerary')
      .select(`*, creator:profiles!creator_id(full_name, avatar_url)`)
      .order('start_date', { ascending: true })
      .gte('end_date', new Date().toISOString().split('T')[0])

    if (creatorId) {
      query = query.eq('creator_id', creatorId)
    } else if (region) {
      query = query.eq('region', region).eq('is_public', true)
    } else {
      query = query.eq('is_public', true)
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ itinerary: data })
  } catch (error: unknown) {
    console.error('❌ Itinerary GET error:', { error: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur chargement itinéraire', details: (error as Error)?.message }, { status: 500 })
  }
}

// POST /api/itinerary — ajouter une étape (auth requise, user doit être le creator)
export async function POST(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const admin = getAdminClient()
    const body = await req.json()
    const { label, region, department, city, lat, lng, start_date, end_date, is_public } = body

    if (!label || !start_date || !end_date) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const { data, error } = await admin.from('itinerary').insert({
      creator_id: user.id, label, region, department, city,
      lat: lat || null, lng: lng || null,
      start_date, end_date, is_public: is_public !== false,
    }).select().single()

    if (error) throw error

    if (is_public !== false && region) {
      const { data: followers } = await admin.from('follows').select('follower_id').eq('followed_id', user.id)
      if (followers?.length) {
        const { data: profile } = await admin.from('profiles').select('full_name').eq('id', user.id).single()
        const notifications = followers.map(f => ({
          user_id: f.follower_id,
          type: 'creator_itinerary',
          title: `${profile?.full_name || 'Un créateur que vous suivez'} arrive dans votre région`,
          body: `${label} — du ${new Date(start_date).toLocaleDateString('fr-FR')} au ${new Date(end_date).toLocaleDateString('fr-FR')}`,
          link: `/creators/${user.id}`,
        }))
        await admin.from('notifications').insert(notifications)
      }
    }
    return NextResponse.json({ entry: data }, { status: 201 })
  } catch (error: unknown) {
    console.error('❌ Itinerary POST error:', { error: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur création itinéraire', details: (error as Error)?.message }, { status: 500 })
  }
}

// DELETE /api/itinerary?id=xxx
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const admin = getAdminClient()
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })

    const { error } = await admin.from('itinerary').delete().eq('id', id).eq('creator_id', user.id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('❌ Itinerary DELETE error:', { error: (error as Error)?.message })
    return NextResponse.json({ error: 'Erreur suppression itinéraire', details: (error as Error)?.message }, { status: 500 })
  }
}
