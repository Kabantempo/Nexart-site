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
  const fontRegular = await pdfDoc.embedFont(SF.Helvetica)
  const fontBold = await pdfDoc.embedFont(SF.HelveticaBold)
  const W = 595
  const H_PAGE = 842
  const FOOTER_Y = 90
  const BODY_MIN = FOOTER_Y + 30 // zone interdite (footer)

  const C = {
    indigo:   c(0.388, 0.400, 0.945),
    dark:     c(0.102, 0.102, 0.102),
    gray:     c(0.533, 0.533, 0.533),
    border:   c(0.898, 0.906, 0.922),
    rowEven:  c(0.976, 0.980, 0.984),
    white:    c(1, 1, 1),
    indigoFd: c(0.800, 0.820, 1.000),
  }

  const contractNumber = `NXRT-PREVIEW-EXEMPLE-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`
  const totalPages = 2

  // ── Helpers ──────────────────────────────────────────────────────────────
  const addHeader = (pg: ReturnType<typeof pdfDoc.addPage>, pageNum: number) => {
    const H = 68
    pg.drawRectangle({ x: 0, y: H_PAGE - H, width: W, height: H, color: C.indigo })
    pg.drawText('NEXART', { x: 40, y: H_PAGE - 38, size: 19, font: fontBold, color: C.white })
    pg.drawText('nexart.fr', { x: 40, y: H_PAGE - 52, size: 8, font: fontRegular, color: C.indigoFd })
    const title = 'CONTRAT DE PARTICIPATION [EXEMPLE]'
    pg.drawText(title, { x: W - 40 - title.length * 5.2, y: H_PAGE - 40, size: 10, font: fontBold, color: C.white })
    const lY = H_PAGE - H - 10
    pg.drawLine({ start: { x: 40, y: lY }, end: { x: W - 40, y: lY }, thickness: 0.5, color: C.border })
    if (pageNum === 1) {
      pg.drawText(`N° Contrat : ${contractNumber}  ·  Généré le ${new Date().toLocaleDateString('fr-FR')} via Nexart`, { x: 40, y: lY - 14, size: 8, font: fontRegular, color: C.gray })
    }
    return lY - (pageNum === 1 ? 34 : 22)
  }

  const addFooter = (pg: ReturnType<typeof pdfDoc.addPage>, pageNum: number) => {
    const fY = FOOTER_Y
    pg.drawLine({ start: { x: 40, y: fY + 16 }, end: { x: W - 40, y: fY + 16 }, thickness: 0.8, color: C.indigo })
    pg.drawText('nexart.fr · contact@nexart.fr', { x: 40, y: fY + 4, size: 7.5, font: fontRegular, color: C.gray })
    const right = `Page ${pageNum}/${totalPages} · ${contractNumber}`
    pg.drawText(right, { x: W - 40 - right.length * 4.2, y: fY + 4, size: 7.5, font: fontRegular, color: C.gray })
    pg.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')} · Archivé 6 ans (art. 1366 Code civil)`, { x: 40, y: fY - 8, size: 7, font: fontRegular, color: C.gray })
  }

  // ── Page 1 ────────────────────────────────────────────────────────────────
  let page = pdfDoc.addPage([W, H_PAGE])
  let y = addHeader(page, 1)
  let rowIdx = 0

  const checkPage = () => {
    if (y <= BODY_MIN) {
      addFooter(page, 1)
      page = pdfDoc.addPage([W, H_PAGE])
      y = addHeader(page, 2)
      rowIdx = 0
    }
  }

  const section = (title: string) => {
    y -= 16; checkPage()
    page.drawText(title, { x: 40, y, size: 10, font: fontBold, color: C.indigo })
    y -= 5
    page.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 0.5, color: C.border })
    y -= 13
  }

  const row = (label: string, value: string) => {
    checkPage()
    if (rowIdx % 2 === 0) page.drawRectangle({ x: 40, y: y - 4, width: W - 80, height: 17, color: C.rowEven })
    page.drawText(`${label} :`, { x: 48, y, size: 9, font: fontBold, color: C.gray })
    page.drawText(value || '—', { x: 200, y, size: 10, font: fontBold, color: C.dark })
    y -= 17; rowIdx++
  }

  const wrapClause = (text: string, maxLen = 92) => {
    const words = text.split(' '); const lines: string[] = []; let cur = ''
    for (const w of words) {
      if ((cur + w).length > maxLen) { if (cur.trim()) lines.push(cur.trim()); cur = w + ' ' } else cur += w + ' '
    }
    if (cur.trim()) lines.push(cur.trim()); return lines
  }

  // ── Contenu ───────────────────────────────────────────────────────────────
  section('ORGANISATEUR')
  row('Nom / Structure', 'Association Créateurs Lyon')
  row('SIRET / RNA', '12345678900010')

  section('CRÉATEUR / EXPOSANT')
  row('Nom', 'Marie Dupont')
  row('Disciplines', 'Céramique, Bijouterie')
  row('Ville', 'Lyon')

  section('ÉVÉNEMENT')
  row('Intitulé', 'Marché des Créateurs — Exemple')
  row('Lieu', 'Salle des fêtes, Lyon')
  row('Date de début', '15 septembre 2026')
  row('Date de fin', '16 septembre 2026')
  row('Horaires', '09:00 — 18:00')

  section('CONDITIONS FINANCIÈRES')
  row('Tarif emplacement', '45,00 €')
  row('Dimensions stand', '3m × 2m')
  row('Modalité paiement', 'À la signature ou selon accord organisateur')

  section('CONDITIONS GÉNÉRALES')
  const clauses = [
    { num: '1. PRÉSENCE ET HORAIRES', body: 'Le créateur s\'engage à être présent sur son emplacement durant toutes les heures d\'ouverture de l\'événement. Tout abandon de poste sans accord préalable de l\'organisateur pourra entraîner l\'exclusion des éditions futures.' },
    { num: '2. EMPLACEMENT ET MATÉRIEL', body: 'L\'organisateur fournit un emplacement conforme aux dimensions indiquées. Le créateur est responsable de son installation, de son matériel et de sa caisse. L\'organisateur décline toute responsabilité en cas de vol, perte ou dommage sur le stand du créateur.' },
    { num: '3. ANNULATION', body: 'Toute annulation doit être notifiée par écrit (email) au moins 7 jours avant l\'événement. En deçà de ce délai, aucun remboursement ne sera effectué. En cas d\'annulation par l\'organisateur, le créateur sera remboursé intégralement dans un délai de 30 jours.' },
    { num: '4. ASSURANCE', body: 'Le créateur est seul responsable de son activité professionnelle. Il est fortement recommandé de souscrire une assurance responsabilité civile professionnelle couvrant la période de l\'événement.' },
    { num: '5. DROITS À L\'IMAGE', body: 'Des photos et vidéos pourront être prises lors de l\'événement à des fins de communication. Le créateur autorise l\'utilisation de ces images incluant ses œuvres. Toute opposition doit être signalée par écrit avant l\'événement.' },
    { num: '6. PROPRIÉTÉ INTELLECTUELLE', body: 'Le présent contrat ne confère aucun droit de propriété sur les œuvres du créateur. Les œuvres restent la propriété exclusive du créateur. Aucune reproduction commerciale sans accord écrit préalable.' },
    { num: '7. INDÉPENDANCE', body: 'Le créateur intervient en qualité de professionnel indépendant. Le présent contrat ne crée aucun lien de subordination, de salariat ou d\'exclusivité entre les parties.' },
    { num: '8. DROIT APPLICABLE', body: 'Le présent contrat est soumis au droit français. Tout litige sera soumis aux tribunaux compétents du ressort du lieu de l\'événement.' },
  ]

  for (const clause of clauses) {
    checkPage()
    page.drawText(clause.num, { x: 48, y, size: 8.5, font: fontBold, color: C.dark })
    y -= 12
    for (const wrapped of wrapClause(clause.body)) {
      checkPage()
      page.drawText(wrapped, { x: 56, y, size: 8, font: fontRegular, color: C.dark })
      y -= 11
    }
    y -= 3
  }

  // ── Signatures ────────────────────────────────────────────────────────────
  if (y <= BODY_MIN + 80) { // besoin de place pour les signatures
    addFooter(page, 1)
    page = pdfDoc.addPage([W, H_PAGE])
    y = addHeader(page, 2)
  }
  y -= 8
  page.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 0.5, color: C.border })
  y -= 14
  page.drawText('SIGNATURES', { x: 40, y, size: 10, font: fontBold, color: C.indigo })
  y -= 12
  page.drawText('Organisateur : Association Créateurs Lyon', { x: 48, y, size: 9, font: fontBold, color: C.dark })
  page.drawText('Créateur : Marie Dupont', { x: 310, y, size: 9, font: fontBold, color: C.dark })
  y -= 12
  page.drawText('Signé électroniquement via Nexart', { x: 48, y, size: 8, font: fontRegular, color: C.gray })
  page.drawText('Accusé de réception par email', { x: 310, y, size: 8, font: fontRegular, color: C.gray })
  y -= 11
  page.drawText(`Horodatage : ${new Date().toISOString()}  ·  N° : ${contractNumber}`, { x: 48, y, size: 7.5, font: fontRegular, color: C.gray })

  // Footer dernière page
  addFooter(page, pdfDoc.getPageCount())

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
