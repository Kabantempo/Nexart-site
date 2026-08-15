export const dynamic = 'force-dynamic'
import { getAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.substring(7)
  if (!token) return null
  const supabase = getAdminClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

// GET: fetch current settings
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const supabase = getAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('notification_prefs, profile_visibility, preferred_language')
      .eq('id', user.id)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creatorProfile } = await (supabase as any)
      .from('creator_profiles')
      .select('travel_radius')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      notification_prefs: profile?.notification_prefs ?? { messages: true, applications: true, reminders: true, newsletter: false },
      profile_visibility: profile?.profile_visibility ?? 'public',
      preferred_language: profile?.preferred_language ?? 'fr',
      travel_radius: creatorProfile?.travel_radius ?? 50,
      is_creator: !!creatorProfile,
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH: update settings
export async function PATCH(req: NextRequest) {
  try {
    const user = await getUser(req)
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const supabase = getAdminClient()

    const profileUpdates: Record<string, unknown> = {}
    if (body.notification_prefs !== undefined) profileUpdates.notification_prefs = body.notification_prefs
    if (body.profile_visibility !== undefined) profileUpdates.profile_visibility = body.profile_visibility
    if (body.preferred_language !== undefined) profileUpdates.preferred_language = body.preferred_language

    if (Object.keys(profileUpdates).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('profiles').update(profileUpdates).eq('id', user.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (body.travel_radius !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('creator_profiles').update({ travel_radius: body.travel_radius }).eq('id', user.id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
