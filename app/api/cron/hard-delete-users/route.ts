export const dynamic = 'force-dynamic'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient()

    const CRON_SECRET = process.env.CRON_SECRET_TOKEN || 'dev-token'

    // Vérifier le token de sécurité
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    // Trouver tous les utilisateurs supprimés depuis > 30 jours
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: usersToDelete, error: selectError } = await supabase
      .from('users')
      .select('id, email, deleted_at')
      .eq('is_hard_deleted', false)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', thirtyDaysAgo)

    if (selectError) {
      console.error('Select error:', selectError)
      return NextResponse.json({ error: 'Erreur lecture BD' }, { status: 500 })
    }

    if (!usersToDelete || usersToDelete.length === 0) {
      return NextResponse.json(
        { message: 'Aucun utilisateur à supprimer', count: 0 },
        { status: 200 }
      )
    }

    // Hard-delete chaque utilisateur
    const deletedIds: string[] = []
    const errors: { userId: string; error: string }[] = []

    for (const user of usersToDelete) {
      try {
        // 1. Supprimer données associées (profiles, applications, messages, etc.)
        await supabase.from('profiles').delete().eq('id', user.id)
        await supabase.from('applications').delete().eq('creator_id', user.id)
        await supabase.from('messages').delete().eq('sender_id', user.id)
        await supabase.from('conversations').delete().eq('creator_id', user.id)
        await supabase.from('reviews').delete().eq('reviewer_id', user.id)
        await supabase.from('posts').delete().eq('author_id', user.id)

        // 2. Marquer as hard-deleted (pas de DELETE de users table pour audit)
        const { error: hardDeleteError } = await supabase
          .from('users')
          .update({
            is_hard_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (hardDeleteError) throw hardDeleteError

        deletedIds.push(user.id)
      } catch (error: unknown) {
        errors.push({
          userId: user.id,
          error: (error instanceof Error ? error.message : String(error)),
        })
        console.error(`[ERROR] Hard-delete user ${user.id}:`, error)
      }
    }

    // 4. Nettoyer les backups des utilisateurs supprimés
    if (deletedIds.length > 0) {
      await supabase
        .from('deleted_user_backups')
        .delete()
        .in('user_id', deletedIds)
    }

    return NextResponse.json(
      {
        message: 'Suppression complétée',
        deleted_count: deletedIds.length,
        errors_count: errors.length,
        deleted_ids: deletedIds,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Erreur serveur', detail: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}

// GET pour test/debug (dev seulement)
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Méthode GET interdite en production' }, { status: 405 })
  }

  try {
    const supabase = getAdminClient()

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: users } = await supabase
      .from('users')
      .select('id, email, deleted_at')
      .eq('is_hard_deleted', false)
      .not('deleted_at', 'is', null)
      .lt('deleted_at', thirtyDaysAgo)

    return NextResponse.json({
      message: 'Utilisateurs à supprimer (dev mode)',
      count: users?.length || 0,
      users: users,
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
