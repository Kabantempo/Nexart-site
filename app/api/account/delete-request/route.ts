import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId et email requis' }, { status: 400 })
    }

    // 1. Vérifier que l'utilisateur existe et que l'email correspond
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, profile:profiles(*)')
      .eq('id', userId)
      .single()

    if (userError || !user || user.email !== email) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    // 2. Créer un backup complet des données utilisateur
    const backupData = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      profile: user.profile,
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

    // 3. Soft-delete: marquer comme supprimé (pas de suppression physique encore)
    const { error: deleteError } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        is_hard_deleted: false,
      })
      .eq('id', userId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Erreur suppression compte' }, { status: 500 })
    }

    // 4. Générer token d'annulation (valide 24h)
    const cancelToken = Buffer.from(`${userId}:${Date.now()}`).toString('base64')
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexart.fr'}/api/account/cancel-deletion?token=${cancelToken}`

    // 5. Envoyer email de confirmation
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
        html: `
          <h2>Suppression de compte demandée</h2>
          <p>Vous avez demandé la suppression de votre compte Nexart.</p>

          <p><strong>Qu'est-ce qui se passe ?</strong></p>
          <ul>
            <li>Votre compte sera masqué immédiatement (soft-delete)</li>
            <li>Vous avez 24h pour annuler cette demande</li>
            <li>Après 30 jours, vos données seront supprimées définitivement</li>
            <li>Contrats restent conservés 11 ans (obligation légale)</li>
          </ul>

          <p><strong>Annuler la suppression ?</strong></p>
          <p><a href="${cancelUrl}">Cliquez ici pour annuler la suppression (lien valide 24h)</a></p>

          <p style="color: #888; font-size: 12px;">
            Si vous n'avez pas demandé cette suppression, ignorez cet email.
          </p>
        `,
      }),
    })

    if (!emailResponse.ok) {
      console.error('Email error:', await emailResponse.text())
      // Ne pas retourner erreur — soft-delete déjà appliqué
    }

    return NextResponse.json(
      {
        message: 'Compte en cours de suppression',
        deleted_at: new Date().toISOString(),
        hard_delete_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelUrl: cancelUrl.split('?')[0] + '?token=***', // masquer token en réponse
      },
      { status: 202 }
    )
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
