export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { sendPushToUsers } from '@/lib/push'

// POST /api/contracts/sign  — signature simple (SES)
export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()

    // Auth requise
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user: authUser } } = await admin.auth.getUser(authHeader.substring(7))
    if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const { contract_id, signer_id } = body

    // L'utilisateur doit signer lui-même
    if (authUser.id !== signer_id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    if (!contract_id || !signer_id) {
      return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
    }

    const { data: contract } = await admin.from('contracts').select('*').eq('id', contract_id).single()
    if (!contract) return NextResponse.json({ error: 'Contrat introuvable' }, { status: 404 })

    if ((contract as any).creator_id !== signer_id && (contract as any).organizer_id !== signer_id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const { data, error } = await admin.from('contracts').update({
      status: 'signed',
      signed_at: new Date().toISOString(),
      signer_ip: ip,
    }).eq('id', contract_id).select().single()

    if (error) throw error

    // Notifier l'autre partie
    const c = contract as any
    const notifiedId = signer_id === c.creator_id ? c.organizer_id : c.creator_id
    await admin.from('notifications').insert({
      user_id: notifiedId,
      type: 'contract_signed',
      title: 'Contrat signé',
      body: 'Un contrat vient d\'être signé pour votre événement.',
      link: `/dashboard`,
    })

    await sendPushToUsers([notifiedId], '📄 Contrat signé', 'Un contrat vient d\'être signé pour votre événement.', '/dashboard')
    return NextResponse.json({ contract: data })
  } catch (error: unknown) {
    console.error('❌ Contract sign error:', { error: (error as Error)?.message, timestamp: new Date().toISOString() })
    return NextResponse.json({ error: 'Erreur signature contrat', details: (error as Error)?.message }, { status: 500 })
  }
}

