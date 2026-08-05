export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { generateReglementPdf, generateConvocationPdf } from '@/lib/pdf-generators'

const FAKE_EVENT = {
  id: 'preview',
  title: 'Marché des Créateurs — Exemple',
  event_type: 'Marché artisanal',
  location: 'Salle des fêtes',
  city: 'Lyon',
  region: 'Auvergne-Rhône-Alpes',
  start_date: '2026-09-15',
  end_date: '2026-09-16',
  start_time: '09:00',
  end_time: '18:00',
  stand_price: 4500,
  stand_dimensions: '3m × 2m',
  theme: ['Artisanat', 'Créations locales'],
  rules: null,
}

const FAKE_CREATOR = {
  id: 'preview-creator',
  full_name: 'Marie Dupont',
  email: 'marie@exemple.fr',
  avatar_url: null,
}

const FAKE_ORGANIZER = {
  full_name: 'Association Créateurs Lyon',
  organizer_profiles: { organization_name: 'Association Créateurs Lyon', siret: '12345678900010' },
}

async function generateContratPdf(): Promise<Buffer> {
  const { PDFDocument: PD, StandardFonts: SF, rgb: c } = await import('pdf-lib')
  const pdfDoc = await PD.create()
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  const fontRegular = await pdfDoc.embedFont(SF.Helvetica)
  const fontBold = await pdfDoc.embedFont(SF.HelveticaBold)
  const gray = c(0.4, 0.4, 0.4)
  const black = c(0, 0, 0)
  const dark = c(0.07, 0.07, 0.07)

  let y = height - 60

  page.drawText('NEXART', { x: 50, y, size: 22, font: fontBold, color: dark })
  page.drawText('[EXEMPLE — non contractuel]', { x: width - 250, y, size: 9, font: fontBold, color: c(0.8, 0.2, 0.2) })
  y -= 30
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: c(0.85, 0.85, 0.85) })
  y -= 30
  page.drawText('CONTRAT DE PARTICIPATION — EMPLACEMENT MARCHÉ', { x: 50, y, size: 14, font: fontBold, color: dark })
  y -= 14
  page.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')} via Nexart (nexart.fr)`, { x: 50, y, size: 9, font: fontRegular, color: gray })

  const section = (title: string) => { y -= 28; page.drawText(title, { x: 50, y, size: 11, font: fontBold, color: dark }); y -= 4; page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: c(0.8, 0.8, 0.8) }); y -= 12 }
  const line = (label: string, value: string) => { page.drawText(`${label} :`, { x: 60, y, size: 9, font: fontBold, color: gray }); page.drawText(value || '—', { x: 200, y, size: 9, font: fontRegular, color: black }); y -= 14 }

  section('ORGANISATEUR')
  line('Nom / Structure', 'Association Créateurs Lyon')
  line('SIRET / RNA', '12345678900010')

  section('CRÉATEUR / EXPOSANT')
  line('Nom', 'Marie Dupont')
  line('Disciplines', 'Céramique, Bijouterie')
  line('Ville', 'Lyon')

  section('ÉVÉNEMENT')
  line('Intitulé', 'Marché des Créateurs — Exemple')
  line('Lieu', 'Salle des fêtes, Lyon')
  line('Date de début', '15 septembre 2026')
  line('Date de fin', '16 septembre 2026')
  line('Horaires', '09:00 — 18:00')

  section('CONDITIONS FINANCIÈRES')
  line('Tarif emplacement', '45,00 €')
  line('Dimensions stand', '3m × 2m')

  section('CONDITIONS GÉNÉRALES')
  const clauses = [
    "1. Le créateur s'engage à être présent aux horaires convenus.",
    "2. L'organisateur fournit un emplacement conforme à la description.",
    "3. Toute annulation doit être notifiée 7 jours avant l'événement.",
    "4. Les deux parties respectent les réglementations en vigueur.",
  ]
  for (const clause of clauses) {
    page.drawText(clause, { x: 60, y, size: 8.5, font: fontRegular, color: black })
    y -= 14
  }

  y -= 20
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: c(0.85, 0.85, 0.85) })
  y -= 20
  page.drawText('SIGNATURE ÉLECTRONIQUE SIMPLE (SES)', { x: 50, y, size: 10, font: fontBold, color: dark })
  y -= 14
  page.drawText(`Horodatage : ${new Date().toISOString()}`, { x: 50, y, size: 8, font: fontRegular, color: gray })

  return Buffer.from(await pdfDoc.save())
}

// GET /api/admin/pdf-preview?type=contrat|reglement|convocation
export async function GET(req: NextRequest) {
  try {
    const admin = getAdminClient()

    // Auth admin requise
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user } } = await admin.auth.getUser(authHeader.substring(7))
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })

    const type = req.nextUrl.searchParams.get('type') || 'contrat'
    let pdfBuffer: Buffer
    let filename: string

    if (type === 'reglement') {
      pdfBuffer = await generateReglementPdf(FAKE_EVENT)
      filename = 'exemple_reglement_interieur.pdf'
    } else if (type === 'convocation') {
      pdfBuffer = await generateConvocationPdf(FAKE_EVENT, FAKE_CREATOR)
      filename = 'exemple_convocation.pdf'
    } else {
      pdfBuffer = await generateContratPdf()
      filename = 'exemple_contrat.pdf'
    }

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/admin/pdf-preview]', err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
