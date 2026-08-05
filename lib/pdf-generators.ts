import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'

// Couleurs Nexart
const indigo = rgb(0.388, 0.4, 0.945)   // #6366F1
const indigoLight = rgb(0.933, 0.933, 0.996) // #EEEEFD
const gray = rgb(0.4, 0.4, 0.4)
const grayLight = rgb(0.88, 0.88, 0.88)
const black = rgb(0, 0, 0)
const dark = rgb(0.07, 0.07, 0.07)
const white = rgb(1, 1, 1)

function wrapText(text: string, maxLen = 75): string[] {
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

// Dessine le header commun Nexart
async function drawHeader(pdfDoc: PDFDocument, page: ReturnType<typeof pdfDoc.addPage>, title: string, subtitle: string) {
  const { width, height } = page.getSize()
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Bande violette en haut
  page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: indigo })

  // Logo NEXART blanc
  page.drawText('NEXART', { x: 50, y: height - 44, size: 20, font: fontBold, color: white })

  // nexart.fr à droite
  page.drawText('nexart.fr', { x: width - 100, y: height - 44, size: 9, font: fontRegular, color: rgb(0.8, 0.82, 1) })

  // Titre du document
  page.drawText(title, { x: 50, y: height - 100, size: 14, font: fontBold, color: dark })

  // Sous-titre (event title ou date)
  if (subtitle) {
    page.drawText(subtitle, { x: 50, y: height - 116, size: 9, font: fontRegular, color: gray })
  }

  return height - 138 // y de départ après le header
}

export async function generateReglementPdf(event: Record<string, any>): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const { width } = page.getSize()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const eventSubtitle = `${event.location || ''}, ${event.city || ''}  —  ${formatDate(event.start_date)} au ${formatDate(event.end_date)}`
  let y = await drawHeader(pdfDoc, page, 'RÈGLEMENT INTÉRIEUR', event.title || '')
  y -= 10
  page.drawText(eventSubtitle, { x: 50, y, size: 8.5, font: fontRegular, color: gray })
  y -= 26

  const section = (title: string) => {
    // Petite bande violette devant le titre de section
    page.drawRectangle({ x: 50, y: y - 2, width: 3, height: 14, color: indigo })
    page.drawText(title, { x: 58, y, size: 10, font: fontBold, color: dark })
    y -= 4
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.4, color: grayLight })
    y -= 13
  }

  const drawLine = (text: string) => {
    for (const wrapped of wrapText(text)) {
      page.drawText(wrapped, { x: 62, y, size: 9, font: fontRegular, color: black })
      y -= 13
    }
  }

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
          ? `Dimensions autorisées : ${event.stand_dimensions}. Toute modification nécessite l'accord écrit de l'organisateur.`
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
    section(s.title)
    for (const line of s.lines) drawLine(line)
    y -= 10
  }

  // Footer
  y -= 6
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.8, color: grayLight })
  y -= 14
  page.drawText(`Signé électroniquement via Nexart — ${new Date().toISOString()}`, { x: 50, y, size: 7.5, font: fontRegular, color: gray })
  y -= 11
  page.drawText('Ce document vaut accord au sens de l\'article 1366 du Code civil.', { x: 50, y, size: 7.5, font: fontRegular, color: gray })

  return Buffer.from(await pdfDoc.save())
}

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

  let y = await drawHeader(pdfDoc, page, 'CONFIRMATION DE PARTICIPATION', event.title || '')
  y -= 16

  const section = (title: string) => {
    page.drawRectangle({ x: 50, y: y - 2, width: 3, height: 14, color: indigo })
    page.drawText(title, { x: 58, y, size: 10, font: fontBold, color: dark })
    y -= 4
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.4, color: grayLight })
    y -= 14
  }

  const row = (label: string, value: string, highlight = false) => {
    page.drawText(`${label} :`, { x: 62, y, size: 9, font: fontBold, color: gray })
    page.drawText(value || '—', { x: 220, y, size: 9, font: highlight ? fontBold : fontRegular, color: highlight ? indigo : black })
    y -= 16
  }

  section('CRÉATEUR')
  row('Nom', creator.full_name || '')
  row('Email', creator.email || '')

  section('ÉVÉNEMENT')
  row('Titre', event.title || '')
  row('Lieu', `${event.location || ''}, ${event.city || ''}`)
  row('Date début', formatDate(event.start_date))
  row('Date fin', formatDate(event.end_date))
  if (event.start_time) row('Horaires', `${event.start_time}${event.end_time ? ` — ${event.end_time}` : ''}`)
  row('Numéro de stand', options.standNumber || 'À confirmer par l\'organisateur', !!options.standNumber)

  section('CONDITIONS FINANCIÈRES')
  row('Montant emplacement', event.stand_price ? `${(event.stand_price / 100).toFixed(2)} €` : 'Voir contrat')
  row('Dimensions stand', event.stand_dimensions || 'Voir contrat')

  section('INFORMATIONS PRATIQUES')
  const mountHour = event.start_time
    ? `${String(Math.max(0, parseInt(event.start_time.split(':')[0]) - 2)).padStart(2, '0')}:00`
    : 'heure communiquée par l\'organisateur'
  const infoLines = [
    `• Montage : à partir de ${formatDate(event.start_date)} à ${mountHour}`,
    `• Démontage : ${formatDate(event.end_date)} après ${event.end_time || 'la fermeture'}`,
    '• Présentez ce document (papier ou téléphone) à l\'accueil.',
  ]
  for (const line of infoLines) {
    page.drawText(line, { x: 62, y, size: 9, font: fontRegular, color: black })
    y -= 14
  }

  // Footer
  y -= 16
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.8, color: grayLight })
  y -= 14

  // Bloc violet "Présentation obligatoire"
  page.drawRectangle({ x: 50, y: y - 28, width: width - 100, height: 38, color: indigoLight, borderColor: indigo, borderWidth: 0.5 })
  page.drawText('Ce document confirme votre participation. Présentez-le à l\'entrée.', {
    x: 62, y: y - 10, size: 9, font: fontBold, color: dark,
  })
  page.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')} · Horodatage : ${new Date().toISOString()}`, {
    x: 62, y: y - 22, size: 7.5, font: fontRegular, color: gray,
  })
  y -= 48

  // QR code
  if (options.verificationToken) {
    const qrUrl = `https://nexart.fr/verify/${options.verificationToken}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 120, margin: 1 })
    const qrBase64 = qrDataUrl.split(',')[1]
    const qrImageBytes = Buffer.from(qrBase64, 'base64')
    const qrImage = await pdfDoc.embedPng(qrImageBytes)
    const qrDims = qrImage.scale(0.42)
    page.drawImage(qrImage, {
      x: width - qrDims.width - 50,
      y: 52,
      width: qrDims.width,
      height: qrDims.height,
    })
    page.drawText('Scanner pour vérifier', {
      x: width - qrDims.width - 50,
      y: 40,
      size: 7.5,
      font: fontRegular,
      color: gray,
    })
  }

  return Buffer.from(await pdfDoc.save())
}
