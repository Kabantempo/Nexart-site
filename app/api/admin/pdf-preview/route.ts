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
  const indigo = c(0.388, 0.4, 0.945)
  const gray = c(0.4, 0.4, 0.4)
  const grayLight = c(0.88, 0.88, 0.88)
  const black = c(0, 0, 0)
  const dark = c(0.07, 0.07, 0.07)
  const white = c(1, 1, 1)

  const contractNumber = `NXRT-PREVIEW-EXEMPLE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`

  // Header violet Nexart
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: indigo })
  page.drawText('NEXART', { x: 50, y: height - 44, size: 20, font: fontBold, color: white })
  page.drawText('[EXEMPLE]', { x: width - 110, y: height - 44, size: 9, font: fontBold, color: c(1, 0.7, 0.7) })
  page.drawText('nexart.fr', { x: width - 100, y: height - 56, size: 8, font: fontRegular, color: c(0.8, 0.82, 1) })
  page.drawText('CONTRAT DE PARTICIPATION — EMPLACEMENT MARCHÉ', { x: 50, y: height - 100, size: 14, font: fontBold, color: dark })
  page.drawText(`N° Contrat : ${contractNumber}`, { x: 50, y: height - 116, size: 9, font: fontBold, color: gray })
  page.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')} via Nexart (nexart.fr)`, { x: 50, y: height - 128, size: 8.5, font: fontRegular, color: gray })

  let y = height - 152

  const section = (title: string) => { y -= 18; page.drawRectangle({ x: 50, y: y - 2, width: 3, height: 14, color: indigo }); page.drawText(title, { x: 58, y, size: 11, font: fontBold, color: dark }); y -= 4; page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.4, color: grayLight }); y -= 12 }
  const line = (label: string, value: string) => { page.drawText(`${label} :`, { x: 60, y, size: 9, font: fontBold, color: gray }); page.drawText(value || '—', { x: 200, y, size: 9, font: fontRegular, color: black }); y -= 14 }

  const wrapClause = (text: string, maxLen = 90) => {
    const words = text.split(' ')
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      if ((current + word).length > maxLen) { if (current.trim()) lines.push(current.trim()); current = word + ' ' }
      else { current += word + ' ' }
    }
    if (current.trim()) lines.push(current.trim())
    return lines
  }

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
    { num: '1. PRÉSENCE ET HORAIRES', body: 'Le créateur s\'engage à être présent sur son emplacement durant toutes les heures d\'ouverture de l\'événement. Tout abandon de poste sans accord préalable de l\'organisateur pourra entraîner l\'exclusion des éditions futures.' },
    { num: '2. EMPLACEMENT ET MATÉRIEL', body: 'L\'organisateur fournit un emplacement conforme aux dimensions indiquées. Le créateur est responsable de son installation, de son matériel et de sa caisse. L\'organisateur décline toute responsabilité en cas de vol, perte ou dommage sur le stand du créateur.' },
    { num: '3. ANNULATION', body: 'Toute annulation doit être notifiée par écrit (email) au moins 7 jours avant l\'événement. En deçà de ce délai, aucun remboursement ne sera effectué. En cas d\'annulation par l\'organisateur, le créateur sera remboursé intégralement dans un délai de 30 jours.' },
    { num: '4. ASSURANCE', body: 'Le créateur est seul responsable de son activité professionnelle. Il est fortement recommandé de souscrire une assurance responsabilité civile professionnelle couvrant la période de l\'événement.' },
    { num: '5. DROITS À L\'IMAGE', body: 'Des photos et vidéos pourront être prises lors de l\'événement à des fins de communication. Le créateur autorise l\'utilisation de ces images incluant ses œuvres. Toute opposition doit être signalée par écrit avant l\'événement.' },
    { num: '6. PROPRIÉTÉ INTELLECTUELLE', body: 'Le présent contrat ne confère aucun droit de propriété sur les œuvres du créateur à l\'organisateur. Les œuvres restent la propriété exclusive du créateur.' },
    { num: '7. INDÉPENDANCE', body: 'Le créateur intervient en qualité de professionnel indépendant. Le présent contrat ne crée aucun lien de subordination, de salariat ou d\'exclusivité entre les parties.' },
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

  y -= 10
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: grayLight })
  y -= 18
  page.drawText('SIGNATURES', { x: 50, y, size: 11, font: fontBold, color: dark })
  y -= 16
  page.drawText('Organisateur : Association Créateurs Lyon', { x: 60, y, size: 9, font: fontBold, color: black })
  page.drawText('Créateur : Marie Dupont', { x: 320, y, size: 9, font: fontBold, color: black })
  y -= 13
  page.drawText('Signé électroniquement via Nexart', { x: 60, y, size: 8, font: fontRegular, color: gray })
  page.drawText('Accusé de réception par email', { x: 320, y, size: 8, font: fontRegular, color: gray })
  y -= 16
  page.drawText(`Horodatage : ${new Date().toISOString()}`, { x: 60, y, size: 8, font: fontRegular, color: gray })
  y -= 12
  page.drawText(`N° contrat : ${contractNumber}`, { x: 60, y, size: 8, font: fontBold, color: gray })
  y -= 12
  page.drawText('Ce document a valeur de contrat conformément à l\'article 1366 du Code civil.', { x: 60, y, size: 8, font: fontRegular, color: gray })
  y -= 11
  page.drawText('Généré et archivé via Nexart (nexart.fr) — Conservation 6 ans.', { x: 60, y, size: 8, font: fontRegular, color: gray })

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
      pdfBuffer = await generateConvocationPdf(FAKE_EVENT, FAKE_CREATOR, {
        verificationToken: '00000000-0000-0000-0000-000000000000',
        standNumber: 'A-12',
      })
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
