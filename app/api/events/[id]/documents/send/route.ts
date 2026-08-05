export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { generateReglementPdf, generateConvocationPdf } from '@/lib/pdf-generators'

// POST /api/events/[id]/documents/send
// Auth: organisateur de l'événement
// Body: { creator_id, candidature_id?, type: 'contrat' | 'reglement' | 'convocation' }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getAdminClient()

    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user } } = await admin.auth.getUser(authHeader.substring(7))
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Vérifier que l'user est organisateur de cet événement
    const { data: event } = await admin.from('events').select('*').eq('id', params.id).single()
    if (!event) return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 })
    if (event.organizer_id !== user.id) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const body = await req.json()
    const { creator_id, candidature_id, type } = body as {
      creator_id: string
      candidature_id?: string
      type: 'contrat' | 'reglement' | 'convocation'
    }

    if (!creator_id || !type) return NextResponse.json({ error: 'creator_id et type requis' }, { status: 400 })
    if (!['contrat', 'reglement', 'convocation'].includes(type)) {
      return NextResponse.json({ error: 'Type invalide' }, { status: 400 })
    }

    // Pour le contrat, déléguer à contracts/generate
    if (type === 'contrat') {
      const contractRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/contracts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          event_id: params.id,
          creator_id,
          organizer_id: user.id,
          application_id: candidature_id,
        }),
      })
      const contractData = await contractRes.json()
      return NextResponse.json(contractData, { status: contractRes.status })
    }

    // Récupérer le créateur
    const { data: creator } = await admin.from('profiles').select('*').eq('id', creator_id).single()
    if (!creator) return NextResponse.json({ error: 'Créateur introuvable' }, { status: 404 })

    // Générer le PDF selon le type
    let pdfBuffer: Buffer
    let docLabel: string
    let emailSubject: string

    if (type === 'reglement') {
      pdfBuffer = await generateReglementPdf(event)
      docLabel = 'reglement'
      emailSubject = `Règlement intérieur — ${event.title}`
    } else {
      pdfBuffer = await generateConvocationPdf(event, creator)
      docLabel = 'convocation'
      emailSubject = `Confirmation de participation — ${event.title}`
    }

    const timestamp = Date.now()
    const filePath = `${params.id}/${creator_id}/${docLabel}_${timestamp}.pdf`

    // Upload dans Supabase Storage (bucket documents)
    const { error: uploadErr } = await admin.storage
      .from('documents')
      .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

    let pdfUrl = ''
    if (!uploadErr) {
      const { data: signedData } = await admin.storage
        .from('documents')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365)
      pdfUrl = signedData?.signedUrl || ''
    }

    // Insérer dans event_documents
    const { data: eventDoc, error: insertErr } = await (admin as any).from('event_documents').insert({
      event_id: params.id,
      creator_id,
      organizer_id: user.id,
      candidature_id: candidature_id || null,
      type,
      pdf_url: pdfUrl,
      file_name: `${docLabel}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`,
      sent_at: new Date().toISOString(),
    }).select().single()

    if (insertErr) throw insertErr

    // Envoyer par email au créateur
    try {
      const RESEND_API_KEY = process.env.RESEND_API_KEY
      const { data: { user: creatorAuth } } = await admin.auth.admin.getUserById(creator_id)
      const creatorEmail = creatorAuth?.email
      if (RESEND_API_KEY && creatorEmail) {
        const base64Pdf = pdfBuffer.toString('base64')
        const safeTitle = (event.title || 'evenement').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'Nexart <noreply@nexart.fr>',
            to: creatorEmail,
            subject: emailSubject,
            html: `<p>Bonjour ${creator.full_name || 'Créateur'},</p><p>Veuillez trouver ci-joint votre document pour <strong>${event.title}</strong>.</p><p>Vous pouvez également le consulter depuis votre tableau de bord Nexart.</p><p>— L'équipe Nexart</p>`,
            attachments: [{ filename: `${docLabel}_${safeTitle}.pdf`, content: base64Pdf }],
          }),
        })
      }
    } catch (emailErr) {
      console.error('[documents/send] email error (non-blocking):', emailErr)
    }

    return NextResponse.json({ success: true, document: eventDoc }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/events/[id]/documents/send]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
