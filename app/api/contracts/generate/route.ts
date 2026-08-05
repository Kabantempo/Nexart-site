export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createHash } from 'crypto'
import { getAdminClient } from '@/lib/supabase-admin'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// POST /api/contracts/generate
// Génère le contrat PDF et l'enregistre dans Supabase Storage
export async function POST(req: NextRequest) {
  try {
  const admin = getAdminClient()

  // Auth requise
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { data: { user: authUser } } = await admin.auth.getUser(authHeader.substring(7))
  if (!authUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { validate: v, z, uuidSchema } = await import('@/lib/validate')
  const schema = z.object({ event_id: uuidSchema, creator_id: uuidSchema, organizer_id: uuidSchema, application_id: uuidSchema.optional() })
  const { data: body, error: validErr } = v(schema, await req.json())
  if (validErr) return validErr
  const { event_id, creator_id, organizer_id, application_id } = body

  // Only the organizer or the creator may generate their own contract
  if (authUser.id !== organizer_id && authUser.id !== creator_id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Récupérer les données
  const [{ data: event }, { data: creator }, { data: organizer }, { data: creatorProfile }] = await Promise.all([
    admin.from('events').select('*').eq('id', event_id).single(),
    admin.from('profiles').select('*').eq('id', creator_id).single(),
    admin.from('profiles').select('*, organizer_profiles(*)').eq('id', organizer_id).single(),
    admin.from('creator_profiles').select('*').eq('user_id', creator_id).maybeSingle(),
  ])

  if (!event || !creator || !organizer) {
    return NextResponse.json({ error: 'Données introuvables' }, { status: 404 })
  }

  // Numéro de contrat unique
  const contractNumber = `NXRT-${event_id.slice(0, 6).toUpperCase()}-${creator_id.slice(0, 6).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`

  // Générer le PDF
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842]) // A4
  const { width, height } = page.getSize()

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const gray = rgb(0.4, 0.4, 0.4)
  const black = rgb(0, 0, 0)
  const dark = rgb(0.07, 0.07, 0.07)

  let y = height - 60

  // En-tête
  page.drawText('NEXART', { x: 50, y, size: 22, font: fontBold, color: dark })
  page.drawText('nexart.fr', { x: width - 150, y, size: 10, font: fontRegular, color: gray })

  y -= 30
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })

  y -= 30
  page.drawText('CONTRAT DE PARTICIPATION — EMPLACEMENT MARCHÉ', {
    x: 50, y, size: 14, font: fontBold, color: dark,
  })
  y -= 14
  page.drawText(`N° Contrat : ${contractNumber}`, { x: 50, y, size: 9, font: fontBold, color: gray })
  y -= 12
  page.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')} via Nexart (nexart.fr)`, {
    x: 50, y, size: 9, font: fontRegular, color: gray,
  })

  const section = (title: string) => {
    y -= 28
    page.drawText(title, { x: 50, y, size: 11, font: fontBold, color: dark })
    y -= 4
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    y -= 12
  }

  const line = (label: string, value: string) => {
    page.drawText(`${label} :`, { x: 60, y, size: 9, font: fontBold, color: gray })
    page.drawText(value || '—', { x: 200, y, size: 9, font: fontRegular, color: black })
    y -= 14
  }

  const wrapClause = (text: string, maxLen = 90) => {
    const words = text.split(' ')
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      if ((current + word).length > maxLen) {
        if (current.trim()) lines.push(current.trim())
        current = word + ' '
      } else {
        current += word + ' '
      }
    }
    if (current.trim()) lines.push(current.trim())
    return lines
  }

  // Organisateur
  section('ORGANISATEUR')
  const orgProfile = (organizer as { organizer_profiles?: { organization_name?: string; siret?: string } }).organizer_profiles
  line('Nom / Structure', orgProfile?.organization_name || organizer.full_name || '')
  line('SIRET / RNA', orgProfile?.siret || '—')
  line('Contact', `(via Nexart)`)

  // Créateur
  section('CRÉATEUR / EXPOSANT')
  line('Nom', creator.full_name || '')
  line('Disciplines', creatorProfile?.disciplines?.join(', ') || '—')
  line('Ville', creatorProfile?.city || '—')
  line('SIRET / Statut', creatorProfile?.siret || 'Micro-entreprise')

  // Événement
  section('ÉVÉNEMENT')
  line('Intitulé', event.title || '')
  line('Type', event.event_type || '')
  line('Lieu', `${event.location}, ${event.city}`)
  line('Date de début', formatDate(event.start_date))
  line('Date de fin', formatDate(event.end_date))
  if (event.start_time) line('Horaires', `${event.start_time} — ${event.end_time || '—'}`)
  line('Thèmes', Array.isArray(event.theme) ? event.theme.join(', ') : event.theme || '—')

  // Conditions financières
  section('CONDITIONS FINANCIÈRES')
  line('Tarif emplacement', event.stand_price ? `${(event.stand_price / 100).toFixed(2)} €` : '—')
  line('Dimensions stand', event.stand_dimensions || '—')
  line('Modalité paiement', 'À la signature du contrat ou selon accord organisateur')

  // 8 clauses légales complètes
  section('CONDITIONS GÉNÉRALES')
  const clauses = [
    { num: '1. PRÉSENCE ET HORAIRES', body: 'Le créateur s\'engage à être présent sur son emplacement durant toutes les heures d\'ouverture de l\'événement. Tout abandon de poste sans accord préalable de l\'organisateur pourra entraîner l\'exclusion des éditions futures.' },
    { num: '2. EMPLACEMENT ET MATÉRIEL', body: 'L\'organisateur fournit un emplacement conforme aux dimensions indiquées. Le créateur est responsable de son installation, de son matériel et de sa caisse. L\'organisateur décline toute responsabilité en cas de vol, perte ou dommage sur le stand du créateur.' },
    { num: '3. ANNULATION', body: 'Toute annulation doit être notifiée par écrit (email) au moins 7 jours avant l\'événement. En deçà de ce délai, aucun remboursement ne sera effectué. En cas d\'annulation par l\'organisateur (force majeure incluse), le créateur sera remboursé intégralement dans un délai de 30 jours.' },
    { num: '4. ASSURANCE', body: 'Le créateur est seul responsable de son activité professionnelle. Il est fortement recommandé de souscrire une assurance responsabilité civile professionnelle couvrant la période de l\'événement. L\'organisateur ne saurait être tenu responsable des dommages causés par le créateur à des tiers.' },
    { num: '5. DROITS À L\'IMAGE', body: 'Des photos et vidéos pourront être prises lors de l\'événement à des fins de communication (réseaux sociaux, site internet). Le créateur autorise l\'utilisation de ces images incluant ses œuvres exposées. Toute opposition doit être signalée par écrit avant l\'événement.' },
    { num: '6. PROPRIÉTÉ INTELLECTUELLE', body: 'Le présent contrat ne confère aucun droit de propriété sur les œuvres du créateur à l\'organisateur. Les œuvres restent la propriété exclusive du créateur. Aucune reproduction commerciale sans accord écrit préalable.' },
    { num: '7. INDÉPENDANCE', body: 'Le créateur intervient en qualité de professionnel indépendant. Le présent contrat ne crée aucun lien de subordination, de salariat ou d\'exclusivité entre les parties. Le créateur reste libre de sa tarification et de ses conditions de vente.' },
    { num: '8. DROIT APPLICABLE', body: 'Le présent contrat est soumis au droit français. Tout litige sera soumis aux tribunaux compétents du ressort du lieu de l\'événement.' },
  ]

  for (const clause of clauses) {
    page.drawText(clause.num, { x: 60, y, size: 8.5, font: fontBold, color: dark })
    y -= 12
    for (const wrapped of wrapClause(clause.body)) {
      page.drawText(wrapped, { x: 70, y, size: 8, font: fontRegular, color: black })
      y -= 11
    }
    y -= 6
  }

  // Section signatures
  y -= 10
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 18
  page.drawText('SIGNATURES', { x: 50, y, size: 11, font: fontBold, color: dark })
  y -= 16

  const orgName = orgProfile?.organization_name || organizer.full_name || 'Organisateur'
  const creatorName = creator.full_name || 'Créateur'
  page.drawText(`Organisateur : ${orgName}`, { x: 60, y, size: 9, font: fontBold, color: black })
  page.drawText(`Créateur : ${creatorName}`, { x: 320, y, size: 9, font: fontBold, color: black })
  y -= 13
  page.drawText('Signé électroniquement via Nexart', { x: 60, y, size: 8, font: fontRegular, color: gray })
  page.drawText('Accusé de réception par email', { x: 320, y, size: 8, font: fontRegular, color: gray })
  y -= 16
  page.drawText(`Horodatage : ${new Date().toISOString()}`, { x: 60, y, size: 8, font: fontRegular, color: gray })
  y -= 12
  page.drawText(`N° contrat : ${contractNumber}`, { x: 60, y, size: 8, font: fontBold, color: gray })
  y -= 14
  page.drawText('Ce document a valeur de contrat conformément à l\'article 1366 du Code civil.', {
    x: 60, y, size: 8, font: fontRegular, color: gray,
  })
  y -= 11
  page.drawText('Généré et archivé via Nexart (nexart.fr) — Conservation 6 ans.', {
    x: 60, y, size: 8, font: fontRegular, color: gray,
  })

  const pdfBytes = await pdfDoc.save()
  const pdfBuffer = Buffer.from(pdfBytes)
  const documentHash = createHash('sha256').update(pdfBuffer).digest('hex')
  const timestamp = Date.now()

  // Upload dans Supabase Storage (bucket contracts — legacy)
  const fileName = `contracts/${event_id}/${creator_id}-${timestamp}.pdf`
  const { error: uploadError } = await admin.storage
    .from('contracts')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  let publicUrl = ''
  if (!uploadError) {
    const { data: { publicUrl: url } } = admin.storage.from('contracts').getPublicUrl(fileName)
    publicUrl = url
  }

  // Upload dans le bucket documents (signed URL — accès privé)
  const docFileName = `${event_id}/${creator_id}/contrat_${timestamp}.pdf`
  const { error: docUploadError } = await admin.storage
    .from('documents')
    .upload(docFileName, pdfBuffer, { contentType: 'application/pdf', upsert: false })

  let signedUrl = publicUrl
  if (!docUploadError) {
    const { data: signedData } = await admin.storage
      .from('documents')
      .createSignedUrl(docFileName, 60 * 60 * 24 * 365)
    if (signedData?.signedUrl) signedUrl = signedData.signedUrl
  }

  // Enregistrer le contrat en base (table contracts)
  const { data: contract } = await admin.from('contracts').upsert({
    event_id,
    creator_id,
    organizer_id,
    application_id: application_id || null,
    status: 'draft',
    pdf_url: publicUrl || signedUrl,
    document_hash: documentHash,
  }, { onConflict: 'event_id,creator_id' }).select().single()

  // Insérer dans event_documents
  const eventDocFileName = `contrat_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`
  const { data: eventDoc } = await (admin as any).from('event_documents').insert({
    event_id,
    creator_id,
    organizer_id,
    candidature_id: application_id || null,
    type: 'contrat',
    pdf_url: signedUrl,
    file_name: eventDocFileName,
    sent_at: new Date().toISOString(),
    contract_number: contractNumber,
  }).select().single()

  // Envoyer le PDF par email au créateur via Resend
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    const { data: { user: creatorAuthUser } } = await admin.auth.admin.getUserById(creator_id)
    const creatorEmail = creatorAuthUser?.email
    if (RESEND_API_KEY && creatorEmail) {
      const base64Pdf = pdfBuffer.toString('base64')
      const safeTitle = (event.title || 'evenement').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Nexart <noreply@nexart.fr>',
          to: creatorEmail,
          subject: `Votre contrat — ${event.title}`,
          html: `<p>Bonjour ${creator.full_name || 'Créateur'},</p><p>Veuillez trouver ci-joint votre contrat de participation à <strong>${event.title}</strong>.</p><p>Vous pouvez également le consulter depuis votre tableau de bord Nexart.</p><p>— L'équipe Nexart</p>`,
          attachments: [{ filename: `contrat_${safeTitle}.pdf`, content: base64Pdf }],
        }),
      })
    }
  } catch (emailErr) {
    console.error('[contracts/generate] email error (non-blocking):', emailErr)
  }

  return NextResponse.json({
    success: true,
    contract,
    document_id: (eventDoc as any)?.id || null,
    pdf_url: signedUrl,
    document_hash: documentHash,
  }, { status: 201 })
  } catch (err) {
    console.error('[contracts/generate]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

