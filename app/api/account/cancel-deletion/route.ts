export const dynamic = 'force-dynamic'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { emailDeleteCancelled } from '@/lib/email-templates'

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient()
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
    }

    // Décoder le token
    let userId: string
    let tokenTimestamp: number

    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [id, timestamp] = decoded.split(':')
      userId = id
      tokenTimestamp = parseInt(timestamp, 10)
    } catch (e) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    }

    // Vérifier que le token n'a pas plus de 24h
    const tokenAge = Date.now() - tokenTimestamp
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000

    if (tokenAge > TWENTY_FOUR_HOURS) {
      return NextResponse.json({ error: 'Token expiré (validité 24h)' }, { status: 410 })
    }

    // Vérifier que l'utilisateur existe et est en soft-delete
    const { data: user, error: userError } = await (supabase as any)
      .from('users')
      .select('id, deleted_at, email')
      .eq('id', userId)
      .single() as any

    if (userError || !user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
    }

    if (!user.deleted_at) {
      return NextResponse.json({ error: 'Compte pas en cours de suppression' }, { status: 400 })
    }

    // Annuler la suppression (soft-delete)
    const { error: restoreError } = await (supabase as any)
      .from('users')
      .update({
        deleted_at: null,
        is_hard_deleted: false,
      })
      .eq('id', userId)

    if (restoreError) {
      console.error('Restore error:', restoreError)
      return NextResponse.json({ error: 'Erreur annulation suppression' }, { status: 500 })
    }

    // Supprimer le backup (pas besoin de le conserver)
    await supabase
      .from('deleted_user_backups')
      .delete()
      .eq('user_id', userId)

    // Envoyer email de confirmation
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@nexart.fr',
        to: user.email,
        subject: 'Suppression de compte annulée',
        html: emailDeleteCancelled(),
      }),
    })

    return NextResponse.json(
      {
        message: 'Suppression annulée',
        status: 'account_restored',
        userId: userId,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
