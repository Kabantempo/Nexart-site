import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

// GET /api/itinerary?creator_id=xxx  or  ?region=xxx (pour organisateurs)
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
    console.log('✓ Itinerary fetched:', { creatorId, region })
    return NextResponse.json({ itinerary: data })
  } catch (error: any) {
    console.error('❌ Itinerary GET error:', { error: error?.message, timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Erreur chargement itinéraire', details: error?.message }, { status: 500 })
  }
}

// POST /api/itinerary — ajouter une étape
export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const body = await req.json()
    const { creator_id, label, region, department, city, lat, lng, start_date, end_date, is_public } = body

    if (!creator_id || !label || !start_date || !end_date) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const { data, error } = await admin.from('itinerary').insert({
      creator_id, label, region, department, city,
      lat: lat || null, lng: lng || null,
      start_date, end_date, is_public: is_public !== false,
    }).select().single()

    if (error) throw error

    // Notifier les followers que ce créateur arrive dans la région
    if (is_public !== false && region) {
      const { data: followers } = await admin.from('follows')
        .select('follower_id')
        .eq('followed_id', creator_id)

      if (followers?.length) {
        const { data: creatorProfile } = await admin.from('profiles')
          .select('full_name')
          .eq('id', creator_id)
          .single()

        const notifications = followers.map(f => ({
          user_id: f.follower_id,
          type: 'creator_itinerary',
          title: `${creatorProfile?.full_name || 'Un créateur que vous suivez'} arrive dans votre région`,
          body: `${label} — du ${new Date(start_date).toLocaleDateString('fr-FR')} au ${new Date(end_date).toLocaleDateString('fr-FR')}`,
          link: `/creators/${creator_id}`,
        }))

        await admin.from('notifications').insert(notifications)
      }
    }

    console.log('✓ Itinerary entry added:', { creator_id, label })
    return NextResponse.json({ entry: data }, { status: 201 })
  } catch (error: any) {
    console.error('❌ Itinerary POST error:', { error: error?.message, timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Erreur création itinéraire', details: error?.message }, { status: 500 })
  }
}

// DELETE /api/itinerary?id=xxx&creator_id=xxx
export async function DELETE(req: NextRequest) {
  try {
    const admin = getAdminClient()
    const id = req.nextUrl.searchParams.get('id')
    const creatorId = req.nextUrl.searchParams.get('creator_id')

    if (!id || !creatorId) return NextResponse.json({ error: 'id et creator_id requis' }, { status: 400 })

    const { error } = await admin.from('itinerary').delete().eq('id', id).eq('creator_id', creatorId)
    if (error) throw error
    console.log('✓ Itinerary entry deleted:', { id, creator_id: creatorId })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Itinerary DELETE error:', { error: error?.message, timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Erreur suppression itinéraire', details: error?.message }, { status: 500 })
  }
}
