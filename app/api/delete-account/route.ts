export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function DELETE(req: Request) {
  try {
    const admin = getAdminClient()
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    const token = authHeader.slice(7)

    const { data: { user }, error: authError } = await admin.auth.getUser(token)
    if (authError || !user) {
      console.warn('❌ Invalid auth token on delete-account')
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const userId = user.id

    // Supprimer les données utilisateur (service role bypasse RLS)
    const results = await Promise.allSettled([
      admin.from('messages').delete().or(`sender_id.eq.${userId},receiver_id.eq.${userId}`),
      admin.from('applications').delete().eq('creator_id', userId),
      admin.from('notifications').delete().eq('user_id', userId),
      admin.from('favorite_events').delete().eq('user_id', userId),
      admin.from('favorite_creators').delete().eq('user_id', userId),
      admin.from('creator_profiles').delete().eq('user_id', userId),
      admin.from('organizer_profiles').delete().eq('user_id', userId),
      admin.from('profiles').delete().eq('id', userId),
    ])

    const failures = results.filter(r => r.status === 'rejected')
    if (failures.length > 0) {
      console.warn(`⚠️  ${failures.length} deletions failed for user ${userId}`)
    }

    // Supprimer le compte auth via SDK admin (plus fiable que l'API Management)
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('❌ Auth deletion failed:', {
        userId,
        error: deleteError.message,
        timestamp: new Date().toISOString(),
      })
      return NextResponse.json(
        { error: 'Erreur suppression compte', details: deleteError.message },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error'
    console.error('❌ Delete account error:', {
      error: errorMsg,
      timestamp: new Date().toISOString(),
    })
    return NextResponse.json(
      { error: 'Erreur suppression compte', details: errorMsg },
      { status: 500 }
    )
  }
}
