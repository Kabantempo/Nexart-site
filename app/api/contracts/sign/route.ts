import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST /api/contracts/sign  — signature simple (SES)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { contract_id, signer_id } = body

  if (!contract_id || !signer_id) {
    return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 })
  }

  const { data: contract } = await admin.from('contracts').select('*').eq('id', contract_id).single()
  if (!contract) return NextResponse.json({ error: 'Contrat introuvable' }, { status: 404 })

  if (contract.creator_id !== signer_id && contract.organizer_id !== signer_id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

  const { data, error } = await admin.from('contracts').update({
    status: 'signed',
    signed_at: new Date().toISOString(),
    signer_ip: ip,
  }).eq('id', contract_id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifier l'autre partie
  const notifiedId = signer_id === contract.creator_id ? contract.organizer_id : contract.creator_id
  await admin.from('notifications').insert({
    user_id: notifiedId,
    type: 'contract_signed',
    title: 'Contrat signé',
    body: 'Un contrat vient d\'être signé pour votre événement.',
    link: `/dashboard`,
  })

  return NextResponse.json({ contract: data })
}
