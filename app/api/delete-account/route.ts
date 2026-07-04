import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function DELETE(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const { data: { user }, error: authError } = await admin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
  }

  const userId = user.id

  // Supprimer les données utilisateur (service role bypasse RLS)
  await Promise.allSettled([
    admin.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
    admin.from('applications').delete().eq('creator_id', userId),
    admin.from('notifications').delete().eq('user_id', userId),
    admin.from('favorite_events').delete().eq('user_id', userId),
    admin.from('favorite_creators').delete().eq('user_id', userId),
    admin.from('creator_profiles').delete().eq('user_id', userId),
    admin.from('organizer_profiles').delete().eq('user_id', userId),
    admin.from('profiles').delete().eq('id', userId),
  ])

  // Supprimer le compte auth via SDK admin (plus fiable que l'API Management)
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
