import { PDFDocument, StandardFonts, rgb, PDFPage, PDFFont } from 'pdf-lib'
import QRCode from 'qrcode'

// ─── Palette Nexart ───────────────────────────────────────────────────────────
const C = {
  indigo:     rgb(0.388, 0.400, 0.945), // #6366F1
  dark:       rgb(0.102, 0.102, 0.102), // #1A1A1A
  gray:       rgb(0.533, 0.533, 0.533), // #888888
  border:     rgb(0.898, 0.906, 0.922), // #E5E7EB
  rowEven:    rgb(0.976, 0.980, 0.984), // #F9FAFB
  white:      rgb(1, 1, 1),
  indigoFade: rgb(0.800, 0.820, 1.000), // nexart.fr text in header
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function wrapText(text: string, maxLen = 78): string[] {
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

// ─── Header commun ───────────────────────────────────────────────────────────
// NEXART à gauche en blanc | Titre du document à droite en blanc
// Sous le header : ligne fine grise + N° contrat/info

interface HeaderOptions {
  docTitle: string       // ex: "CONTRAT DE PARTICIPATION"
  docSubtitle?: string   // ex: N° contrat ou date
}

async function drawPageHeader(
  pdfDoc: PDFDocument,
  page: PDFPage,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  opts: HeaderOptions,
): Promise<number> {
  const { width, height } = page.getSize()
  const H = 68 // hauteur du bandeau

  // Bande violette pleine
  page.drawRectangle({ x: 0, y: height - H, width, height: H, color: C.indigo })

  // NEXART à gauche
  page.drawText('NEXART', { x: 40, y: height - 38, size: 19, font: fontBold, color: C.white })
  page.drawText('nexart.fr', { x: 40, y: height - 52, size: 8, font: fontRegular, color: C.indigoFade })

  // Titre du document à droite, centré verticalement dans la bande
  const titleSize = 12
  const titleWidth = opts.docTitle.length * titleSize * 0.55
  page.drawText(opts.docTitle, {
    x: width - 40 - titleWidth,
    y: height - 40,
    size: titleSize,
    font: fontBold,
    color: C.white,
  })

  // Sous le header : ligne fine grise + infos
  const lineY = height - H - 10
  page.drawLine({ start: { x: 40, y: lineY }, end: { x: width - 40, y: lineY }, thickness: 0.5, color: C.border })

  if (opts.docSubtitle) {
    page.drawText(opts.docSubtitle, { x: 40, y: lineY - 14, size: 8, font: fontRegular, color: C.gray })
  }

  return lineY - (opts.docSubtitle ? 30 : 18) // y de départ du corps
}

// ─── Footer commun ───────────────────────────────────────────────────────────

function drawPageFooter(
  page: PDFPage,
  fontRegular: PDFFont,
  docNumber?: string,
) {
  const { width } = page.getSize()
  const fY = 90

  // Ligne fine violette
  page.drawLine({ start: { x: 40, y: fY + 16 }, end: { x: width - 40, y: fY + 16 }, thickness: 0.8, color: C.indigo })

  // Texte gauche : site + email
  page.drawText('nexart.fr · contact@nexart.fr', { x: 40, y: fY + 4, size: 7.5, font: fontRegular, color: C.gray })

  // Texte droite : N° + page
  const right = docNumber ? `Page 1/1 · ${docNumber}` : 'Page 1/1'
  page.drawText(right, { x: width - 40 - right.length * 4.2, y: fY + 4, size: 7.5, font: fontRegular, color: C.gray })

  // Ligne du bas
  page.drawText(
    `Généré le ${new Date().toLocaleDateString('fr-FR')} · Archivé 6 ans (art. 1366 Code civil)`,
    { x: 40, y: fY - 8, size: 7, font: fontRegular, color: C.gray }
  )
}

// ─── Section title ────────────────────────────────────────────────────────────

function drawSection(page: PDFPage, fontBold: PDFFont, title: string, y: number, width: number): number {
  y -= 18
  page.drawText(title, { x: 40, y, size: 10, font: fontBold, color: C.indigo })
  y -= 5
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: C.border })
  y -= 13
  return y
}

// ─── Row (label + valeur) ─────────────────────────────────────────────────────

function drawRow(
  page: PDFPage,
  fontBold: PDFFont,
  fontRegular: PDFFont,
  label: string,
  value: string,
  y: number,
  width: number,
  rowIndex: number,
): number {
  const rowH = 17
  // Fond légèrement grisé sur les lignes paires
  if (rowIndex % 2 === 0) {
    page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: rowH, color: C.rowEven })
  }
  page.drawText(`${label} :`, { x: 48, y, size: 9, font: fontBold, color: C.gray })
  page.drawText(value || '—', { x: 200, y, size: 10, font: fontBold, color: C.dark })
  return y - rowH
}

// ─── RÈGLEMENT INTÉRIEUR ─────────────────────────────────────────────────────

export async function generateReglementPdf(event: Record<string, any>): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const { width } = page.getSize()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const subtitle = `${event.location || ''}, ${event.city || ''}  ·  ${formatDate(event.start_date)} – ${formatDate(event.end_date)}`
  let y = await drawPageHeader(pdfDoc, page, fontBold, fontRegular, {
    docTitle: 'RÈGLEMENT INTÉRIEUR',
    docSubtitle: `${event.title || ''}  ·  ${subtitle}`,
  })

  const sections: Array<{ title: string; lines: string[] }> = [
    {
      title: '1. HORAIRES',
      lines: [
        'Présence obligatoire durant toutes les heures d\'ouverture au public.',
        event.start_time
          ? `Montage : avant ${event.start_time}  /  Démontage : après ${event.end_time || 'fermeture'}`
          : 'Les horaires de montage et démontage seront communiqués par l\'organisateur.',
      ],
    },
    {
      title: '2. EMPLACEMENT',
      lines: [
        event.stand_dimensions
          ? `Dimensions autorisées : ${event.stand_dimensions}. Toute modification nécessite l\'accord écrit de l\'organisateur.`
          : 'L\'emplacement attribué doit être respecté. Toute modification nécessite l\'accord de l\'organisateur.',
      ],
    },
    {
      title: '3. INTERDICTIONS',
      lines: [
        '— Revente de produits non déclarés à l\'organisateur.',
        '— Amplification sonore sans autorisation préalable.',
        '— Consommation ou vente d\'alcool sur le stand.',
        '— Sous-location ou cession de l\'emplacement à un tiers.',
      ],
    },
    {
      title: '4. SÉCURITÉ',
      lines: [
        'Le respect des consignes de sécurité incendie est obligatoire.',
        'Les voies d\'accès et de secours doivent rester dégagées en permanence.',
        'Tout matériel présentant un danger devra être retiré à la demande de l\'organisateur.',
      ],
    },
    {
      title: '5. RESPONSABILITÉS',
      lines: [
        'L\'organisateur décline toute responsabilité en cas de vol, dégradation ou sinistre sur les biens exposés.',
        'Le créateur est responsable de ses biens et de la sécurité de son emplacement.',
      ],
    },
    {
      title: '6. SANCTIONS',
      lines: [
        'Tout manquement au présent règlement peut entraîner l\'exclusion immédiate sans remboursement.',
        'L\'organisateur se réserve le droit de refuser l\'accès à toute personne ne respectant pas ces règles.',
      ],
    },
  ]

  for (const s of sections) {
    y = drawSection(page, fontBold, s.title, y, width)
    for (const line of s.lines) {
      for (const wrapped of wrapText(line)) {
        page.drawText(wrapped, { x: 50, y, size: 9, font: fontRegular, color: C.dark, lineHeight: 14.4 })
        y -= 14
      }
      y -= 3
    }
    y -= 4
  }

  drawPageFooter(page, fontRegular)
  return Buffer.from(await pdfDoc.save())
}

// ─── CONVOCATION ─────────────────────────────────────────────────────────────

export async function generateConvocationPdf(
  event: Record<string, any>,
  creator: Record<string, any>,
  options: { verificationToken?: string; standNumber?: string } = {},
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const { width } = page.getSize()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = await drawPageHeader(pdfDoc, page, fontBold, fontRegular, {
    docTitle: 'CONFIRMATION DE PARTICIPATION',
    docSubtitle: `Généré le ${new Date().toLocaleDateString('fr-FR')} · Horodatage : ${new Date().toISOString()}`,
  })

  // ── Badge stand ──────────────────────────────────────────────────────────
  if (options.standNumber) {
    y -= 8
    const badgeW = 200
    const badgeH = 48
    const badgeX = width / 2 - badgeW / 2
    page.drawRectangle({ x: badgeX, y: y - badgeH, width: badgeW, height: badgeH, color: C.indigo })
    const standLabel = `STAND N° ${options.standNumber}`
    page.drawText(standLabel, {
      x: badgeX + badgeW / 2 - standLabel.length * 6.5,
      y: y - 20,
      size: 14,
      font: fontBold,
      color: C.white,
    })
    const dimLabel = event.stand_dimensions || ''
    page.drawText(dimLabel, {
      x: badgeX + badgeW / 2 - dimLabel.length * 3.6,
      y: y - 36,
      size: 9,
      font: fontRegular,
      color: C.indigoFade,
    })
    y -= badgeH + 18
  }

  // ── Sections infos ────────────────────────────────────────────────────────
  let rowIdx = 0

  y = drawSection(page, fontBold, 'CRÉATEUR', y, width)
  y = drawRow(page, fontBold, fontRegular, 'Nom', creator.full_name || '', y, width, rowIdx++)
  y = drawRow(page, fontBold, fontRegular, 'Email', creator.email || '', y, width, rowIdx++)

  y = drawSection(page, fontBold, 'ÉVÉNEMENT', y, width)
  y = drawRow(page, fontBold, fontRegular, 'Titre', event.title || '', y, width, rowIdx++)
  y = drawRow(page, fontBold, fontRegular, 'Lieu', `${event.location || ''}, ${event.city || ''}`, y, width, rowIdx++)
  y = drawRow(page, fontBold, fontRegular, 'Date début', formatDate(event.start_date), y, width, rowIdx++)
  y = drawRow(page, fontBold, fontRegular, 'Date fin', formatDate(event.end_date), y, width, rowIdx++)
  if (event.start_time) y = drawRow(page, fontBold, fontRegular, 'Horaires', `${event.start_time}${event.end_time ? ` — ${event.end_time}` : ''}`, y, width, rowIdx++)

  y = drawSection(page, fontBold, 'CONDITIONS FINANCIÈRES', y, width)
  y = drawRow(page, fontBold, fontRegular, 'Montant emplacement', event.stand_price ? `${(event.stand_price / 100).toFixed(2)} €` : 'Voir contrat', y, width, rowIdx++)
  y = drawRow(page, fontBold, fontRegular, 'Dimensions stand', event.stand_dimensions || 'Voir contrat', y, width, rowIdx++)

  // ── Informations pratiques ────────────────────────────────────────────────
  y = drawSection(page, fontBold, 'INFORMATIONS PRATIQUES', y, width)
  const mountHour = event.start_time
    ? `${String(Math.max(0, parseInt(event.start_time.split(':')[0]) - 2)).padStart(2, '0')}:00`
    : 'heure communiquée par l\'organisateur'
  const infos = [
    `• Montage : à partir de ${formatDate(event.start_date)} à ${mountHour}`,
    `• Démontage : ${formatDate(event.end_date)} après ${event.end_time || 'la fermeture'}`,
    '• Présentez ce document (papier ou téléphone) à l\'accueil.',
  ]
  for (const info of infos) {
    page.drawText(info, { x: 50, y, size: 9, font: fontRegular, color: C.dark })
    y -= 15
  }

  // ── Bandeau "Présentation obligatoire" ────────────────────────────────────
  y -= 12
  page.drawRectangle({ x: 40, y: y - 34, width: width - 80, height: 42, color: rgb(0.933, 0.933, 0.996), borderColor: C.indigo, borderWidth: 0.8 })
  page.drawText('Ce document confirme votre participation. Présentez-le à l\'entrée de l\'événement.', {
    x: 50, y: y - 14, size: 9, font: fontBold, color: C.dark,
  })
  page.drawText('Signé électroniquement via Nexart', {
    x: 50, y: y - 26, size: 8, font: fontRegular, color: C.gray,
  })

  // ── QR code encadré ───────────────────────────────────────────────────────
  if (options.verificationToken) {
    const qrUrl = `https://nexart.fr/verify/${options.verificationToken}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 140, margin: 1 })
    const qrBase64 = qrDataUrl.split(',')[1]
    const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'))
    const qrSize = 90
    const qrX = width - 40 - qrSize - 10
    const qrY = 120

    // Encadré blanc avec bordure grise (effet ombre simulé)
    page.drawRectangle({ x: qrX - 6, y: qrY - 6, width: qrSize + 12, height: qrSize + 22, color: rgb(0.92, 0.92, 0.92) })
    page.drawRectangle({ x: qrX - 5, y: qrY - 5, width: qrSize + 10, height: qrSize + 21, color: C.white, borderColor: C.border, borderWidth: 0.8 })

    page.drawImage(qrImage, { x: qrX, y: qrY + 6, width: qrSize, height: qrSize })
    page.drawText('Scanner à l\'entrée', {
      x: qrX + qrSize / 2 - 32,
      y: qrY - 4,
      size: 7.5,
      font: fontBold,
      color: C.indigo,
    })
  }

  drawPageFooter(page, fontRegular)
  return Buffer.from(await pdfDoc.save())
}
