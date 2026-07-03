import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function DELETE(req: Request) {
  // Verify the user's session from the Authorization header
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
  }

  const userId = user.id
  const pat = process.env.SUPABASE_PAT
  const projectRef = process.env.SUPABASE_PROJECT_REF

  if (!pat || !projectRef) {
    return NextResponse.json({ error: 'Configuration manquante' }, { status: 500 })
  }

  // Delete user data first (cascades may not cover everything)
  await Promise.allSettled([
    supabaseAdmin.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
    supabaseAdmin.from('applications').delete().eq('creator_id', userId),
    supabaseAdmin.from('notifications').delete().eq('user_id', userId),
    supabaseAdmin.from('favorite_events').delete().eq('user_id', userId),
    supabaseAdmin.from('favorite_creators').delete().eq('user_id', userId),
    supabaseAdmin.from('creator_profiles').delete().eq('user_id', userId),
    supabaseAdmin.from('organizer_profiles').delete().eq('user_id', userId),
  ])

  // Delete the auth user via Management API
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/auth/users/${userId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: `Échec suppression: ${body}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
