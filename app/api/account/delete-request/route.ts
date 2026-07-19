export const dynamic = 'force-dynamic'
import { getAdminClient } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'
import { emailDeleteRequest } from '@/lib/email-templates'

export async function POST(req: NextRequest) {
  try {
    const supabase = getAdminClient()

    // Auth requise
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user: authUser } } = await supabase.auth.getUser(authHeader.substring(7))
    if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { validate: v, z } = await import('@/lib/validate')
    const schema = z.object({
      userId: z.string().uuid(),
      email: z.string().email(),
    })
    const { data: parsed, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { userId, email } = parsed

    // Seul l'utilisateur lui-même peut demander la suppression
    if (authUser.id !== userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier que l'email correspond
    if (authUser.email !== email) {
      return NextResponse.json({ error: 'Email incorrect' }, { status: 400 })
    }

    // Récupérer le profil pour le backup
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()

    // Créer un backup complet des données utilisateur
    const backupData = {
      user: {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
      },
      profile,
      deletion_requested_at: new Date().toISOString(),
    }

    const { error: backupError } = await supabase
      .from('deleted_user_backups')
      .insert({
        user_id: userId,
        backup_data: backupData,
        deletion_requested_at: new Date().toISOString(),
      })

    if (backupError) {
      console.error('Backup error:', backupError)
      return NextResponse.json({ error: 'Erreur backup données' }, { status: 500 })
    }

    // Soft-delete: marquer le profil comme supprimé
    const { error: deleteError } = await supabase
      .from('profiles')
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', userId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Erreur suppression compte' }, { status: 500 })
    }

    // Générer token d'annulation (valide 24h)
    const cancelToken = Buffer.from(`${userId}:${Date.now()}`).toString('base64')
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexart.fr'}/api/account/cancel-deletion?token=${cancelToken}`

    // Envoyer email de confirmation
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@nexart.fr',
        to: email,
        subject: 'Suppression de compte Nexart — Confirmez votre demande',
        html: emailDeleteRequest(cancelUrl),
      }),
    })

    if (!emailResponse.ok) {
      console.error('Email error:', await emailResponse.text())
    }

    return NextResponse.json(
      {
        message: 'Compte en cours de suppression',
        deleted_at: new Date().toISOString(),
        hard_delete_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelUrl: cancelUrl.split('?')[0] + '?token=***',
      },
      { status: 202 }
    )
  } catch (error: unknown) {
    console.error('Erreur API:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
