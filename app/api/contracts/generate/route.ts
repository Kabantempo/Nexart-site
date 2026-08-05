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

  // ─── Génération PDF ─────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Palette Nexart
  const C = {
    indigo:   rgb(0.388, 0.400, 0.945),
    dark:     rgb(0.102, 0.102, 0.102),
    gray:     rgb(0.533, 0.533, 0.533),
    border:   rgb(0.898, 0.906, 0.922),
    rowEven:  rgb(0.976, 0.980, 0.984),
    white:    rgb(1, 1, 1),
    indigoFd: rgb(0.800, 0.820, 1.000),
  }

  // ── Header ────────────────────────────────────────────────────────────────
  const H = 68
  page.drawRectangle({ x: 0, y: height - H, width, height: H, color: C.indigo })
  page.drawText('NEXART', { x: 40, y: height - 38, size: 19, font: fontBold, color: C.white })
  page.drawText('nexart.fr', { x: 40, y: height - 52, size: 8, font: fontRegular, color: C.indigoFd })
  const docTitle = 'CONTRAT DE PARTICIPATION'
  page.drawText(docTitle, { x: width - 40 - docTitle.length * 6.6, y: height - 40, size: 12, font: fontBold, color: C.white })
  const lineY = height - H - 10
  page.drawLine({ start: { x: 40, y: lineY }, end: { x: width - 40, y: lineY }, thickness: 0.5, color: C.border })
  page.drawText(`N° Contrat : ${contractNumber}  ·  Généré le ${new Date().toLocaleDateString('fr-FR')} via Nexart`, {
    x: 40, y: lineY - 14, size: 8, font: fontRegular, color: C.gray,
  })

  let y = lineY - 34
  let rowIdx = 0

  // helpers locaux
  const section = (title: string) => {
    y -= 16
    page.drawText(title, { x: 40, y, size: 10, font: fontBold, color: C.indigo })
    y -= 5
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: C.border })
    y -= 13
  }

  const row = (label: string, value: string) => {
    if (rowIdx % 2 === 0) page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 17, color: C.rowEven })
    page.drawText(`${label} :`, { x: 48, y, size: 9, font: fontBold, color: C.gray })
    page.drawText(value || '—', { x: 200, y, size: 10, font: fontBold, color: C.dark })
    y -= 17
    rowIdx++
  }

  const wrapClause = (text: string, maxLen = 92) => {
    const words = text.split(' ')
    const lines: string[] = []
    let cur = ''
    for (const w of words) {
      if ((cur + w).length > maxLen) { if (cur.trim()) lines.push(cur.trim()); cur = w + ' ' }
      else cur += w + ' '
    }
    if (cur.trim()) lines.push(cur.trim())
    return lines
  }

  // ── Corps ─────────────────────────────────────────────────────────────────
  const orgProfile = (organizer as { organizer_profiles?: { organization_name?: string; siret?: string } }).organizer_profiles

  section('ORGANISATEUR')
  row('Nom / Structure', orgProfile?.organization_name || organizer.full_name || '')
  row('SIRET / RNA', orgProfile?.siret || '—')
  row('Contact', '(via Nexart)')

  section('CRÉATEUR / EXPOSANT')
  row('Nom', creator.full_name || '')
  row('Disciplines', creatorProfile?.disciplines?.join(', ') || '—')
  row('Ville', creatorProfile?.city || '—')
  row('SIRET / Statut', creatorProfile?.siret || 'Micro-entreprise')

  section('ÉVÉNEMENT')
  row('Intitulé', event.title || '')
  row('Type', event.event_type || '')
  row('Lieu', `${event.location}, ${event.city}`)
  row('Date de début', formatDate(event.start_date))
  row('Date de fin', formatDate(event.end_date))
  if (event.start_time) row('Horaires', `${event.start_time} — ${event.end_time || '—'}`)
  row('Thèmes', Array.isArray(event.theme) ? event.theme.join(', ') : event.theme || '—')

  section('CONDITIONS FINANCIÈRES')
  row('Tarif emplacement', event.stand_price ? `${(event.stand_price / 100).toFixed(2)} €` : '—')
  row('Dimensions stand', event.stand_dimensions || '—')
  row('Modalité paiement', 'À la signature du contrat ou selon accord organisateur')

  section('CONDITIONS GÉNÉRALES')
  const clauses = [
    { num: '1. PRÉSENCE ET HORAIRES', body: 'Le créateur s\'engage à être présent sur son emplacement durant toutes les heures d\'ouverture de l\'événement. Tout abandon de poste sans accord préalable de l\'organisateur pourra entraîner l\'exclusion des éditions futures.' },
    { num: '2. EMPLACEMENT ET MATÉRIEL', body: 'L\'organisateur fournit un emplacement conforme aux dimensions indiquées. Le créateur est responsable de son installation, de son matériel et de sa caisse. L\'organisateur décline toute responsabilité en cas de vol, perte ou dommage sur le stand du créateur.' },
    { num: '3. ANNULATION', body: 'Toute annulation doit être notifiée par écrit (email) au moins 7 jours avant l\'événement. En deçà de ce délai, aucun remboursement ne sera effectué. En cas d\'annulation par l\'organisateur (force majeure incluse), le créateur sera remboursé intégralement dans un délai de 30 jours.' },
    { num: '4. ASSURANCE', body: 'Le créateur est seul responsable de son activité professionnelle. Il est fortement recommandé de souscrire une assurance responsabilité civile professionnelle couvrant la période de l\'événement. L\'organisateur ne saurait être tenu responsable des dommages causés par le créateur à des tiers.' },
    { num: '5. DROITS À L\'IMAGE', body: 'Des photos et vidéos pourront être prises lors de l\'événement à des fins de communication. Le créateur autorise l\'utilisation de ces images incluant ses œuvres. Toute opposition doit être signalée par écrit avant l\'événement.' },
    { num: '6. PROPRIÉTÉ INTELLECTUELLE', body: 'Le présent contrat ne confère aucun droit de propriété sur les œuvres du créateur à l\'organisateur. Les œuvres restent la propriété exclusive du créateur. Aucune reproduction commerciale sans accord écrit préalable.' },
    { num: '7. INDÉPENDANCE', body: 'Le créateur intervient en qualité de professionnel indépendant. Le présent contrat ne crée aucun lien de subordination, de salariat ou d\'exclusivité entre les parties. Le créateur reste libre de sa tarification et de ses conditions de vente.' },
    { num: '8. DROIT APPLICABLE', body: 'Le présent contrat est soumis au droit français. Tout litige sera soumis aux tribunaux compétents du ressort du lieu de l\'événement.' },
  ]

  for (const clause of clauses) {
    page.drawText(clause.num, { x: 48, y, size: 8.5, font: fontBold, color: C.dark })
    y -= 12
    for (const wrapped of wrapClause(clause.body)) {
      page.drawText(wrapped, { x: 56, y, size: 8, font: fontRegular, color: C.dark })
      y -= 11
    }
    y -= 5
  }

  // ── Signatures ────────────────────────────────────────────────────────────
  y -= 8
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: C.border })
  y -= 16
  page.drawText('SIGNATURES', { x: 40, y, size: 10, font: fontBold, color: C.indigo })
  y -= 14
  const orgName = orgProfile?.organization_name || organizer.full_name || 'Organisateur'
  const creatorName = creator.full_name || 'Créateur'
  page.drawText(`Organisateur : ${orgName}`, { x: 48, y, size: 9, font: fontBold, color: C.dark })
  page.drawText(`Créateur : ${creatorName}`, { x: 310, y, size: 9, font: fontBold, color: C.dark })
  y -= 13
  page.drawText('Signé électroniquement via Nexart', { x: 48, y, size: 8, font: fontRegular, color: C.gray })
  page.drawText('Accusé de réception par email', { x: 310, y, size: 8, font: fontRegular, color: C.gray })
  y -= 12
  page.drawText(`Horodatage : ${new Date().toISOString()}  ·  N° : ${contractNumber}`, { x: 48, y, size: 7.5, font: fontRegular, color: C.gray })

  // ── Footer ────────────────────────────────────────────────────────────────
  const fY = 48
  page.drawLine({ start: { x: 40, y: fY + 16 }, end: { x: width - 40, y: fY + 16 }, thickness: 0.8, color: C.indigo })
  page.drawText('nexart.fr · contact@nexart.fr', { x: 40, y: fY + 4, size: 7.5, font: fontRegular, color: C.gray })
  const right = `Page 1/1 · ${contractNumber}`
  page.drawText(right, { x: width - 40 - right.length * 4.2, y: fY + 4, size: 7.5, font: fontRegular, color: C.gray })
  page.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')} · Archivé 6 ans (art. 1366 Code civil)`, { x: 40, y: fY - 8, size: 7, font: fontRegular, color: C.gray })

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

