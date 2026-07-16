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

  const body = await req.json()
  const { event_id, creator_id, organizer_id, application_id } = body

  if (!event_id || !creator_id || !organizer_id) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
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

  // Conditions générales
  section('CONDITIONS GÉNÉRALES')
  const clauses = [
    '1. Le créateur s\'engage à être présent aux horaires convenus et à respecter son emplacement.',
    '2. L\'organisateur s\'engage à fournir un emplacement conforme à la description.',
    '3. Toute annulation doit être notifiée par écrit via Nexart au moins 7 jours avant l\'événement.',
    '4. En cas d\'annulation de l\'événement par l\'organisateur, le tarif sera remboursé intégralement.',
    '5. Les deux parties s\'engagent à respecter les réglementations sanitaires et de sécurité en vigueur.',
  ]
  clauses.forEach(clause => {
    const words = clause.split(' ')
    let currentLine = ''
    words.forEach(word => {
      if ((currentLine + word).length > 75) {
        page.drawText(currentLine.trim(), { x: 60, y, size: 8.5, font: fontRegular, color: black })
        y -= 12
        currentLine = word + ' '
      } else {
        currentLine += word + ' '
      }
    })
    if (currentLine.trim()) {
      page.drawText(currentLine.trim(), { x: 60, y, size: 8.5, font: fontRegular, color: black })
      y -= 16
    }
  })

  // Signature (SES simple)
  y -= 20
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 20
  page.drawText('SIGNATURE ÉLECTRONIQUE SIMPLE (SES)', { x: 50, y, size: 10, font: fontBold, color: dark })
  y -= 14
  page.drawText('Par action sur Nexart, les parties acceptent les termes du présent contrat.', {
    x: 50, y, size: 8.5, font: fontRegular, color: gray,
  })
  y -= 12
  page.drawText(`Horodatage de génération : ${new Date().toISOString()}`, {
    x: 50, y, size: 8, font: fontRegular, color: gray,
  })
  y -= 12
  page.drawText('Ce document vaut accord contractuel au sens de l\'article 1366 du Code civil.', {
    x: 50, y, size: 8, font: fontRegular, color: gray,
  })

  const pdfBytes = await pdfDoc.save()
  const pdfBuffer = Buffer.from(pdfBytes)
  const documentHash = createHash('sha256').update(pdfBuffer).digest('hex')

  // Upload dans Supabase Storage
  const fileName = `contracts/${event_id}/${creator_id}-${Date.now()}.pdf`
  const { error: uploadError } = await admin.storage
    .from('contracts')
    .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

  if (uploadError) {
    // Retourner le PDF en direct si l'upload échoue
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrat-nexart-${event.title?.replace(/\s+/g, '-')}.pdf"`,
      },
    })
  }

  const { data: { publicUrl } } = admin.storage.from('contracts').getPublicUrl(fileName)

  // Enregistrer le contrat en base
  const { data: contract } = await admin.from('contracts').upsert({
    event_id,
    creator_id,
    organizer_id,
    application_id: application_id || null,
    status: 'draft',
    pdf_url: publicUrl,
    document_hash: documentHash,
  }, { onConflict: 'event_id,creator_id' }).select().single()

  return NextResponse.json({ contract, pdf_url: publicUrl, document_hash: documentHash }, { status: 201 })
  } catch (err) {
    console.error('[contracts/generate]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

