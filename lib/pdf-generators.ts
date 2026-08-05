import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const gray = rgb(0.4, 0.4, 0.4)
const black = rgb(0, 0, 0)
const dark = rgb(0.07, 0.07, 0.07)

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

export async function generateReglementPdf(event: Record<string, any>): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 60

  page.drawText('NEXART', { x: 50, y, size: 22, font: fontBold, color: dark })
  page.drawText('nexart.fr', { x: width - 150, y, size: 10, font: fontRegular, color: gray })
  y -= 30
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 30
  page.drawText('RÈGLEMENT INTÉRIEUR', { x: 50, y, size: 16, font: fontBold, color: dark })
  y -= 16
  page.drawText(event.title || '', { x: 50, y, size: 12, font: fontBold, color: dark })
  y -= 14
  page.drawText(`${event.location || ''}, ${event.city || ''}  —  ${formatDate(event.start_date)} au ${formatDate(event.end_date)}`, {
    x: 50, y, size: 9, font: fontRegular, color: gray,
  })
  y -= 30

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

  for (const section of sections) {
    page.drawText(section.title, { x: 50, y, size: 10, font: fontBold, color: dark })
    y -= 4
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    y -= 12
    for (const line of section.lines) {
      for (const wrapped of wrapText(line)) {
        page.drawText(wrapped, { x: 60, y, size: 9, font: fontRegular, color: black })
        y -= 13
      }
    }
    y -= 10
  }

  y -= 10
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 14
  page.drawText(`Signé électroniquement via Nexart — ${new Date().toISOString()}`, {
    x: 50, y, size: 8, font: fontRegular, color: gray,
  })
  y -= 11
  page.drawText('Ce document vaut accord au sens de l\'article 1366 du Code civil.', {
    x: 50, y, size: 8, font: fontRegular, color: gray,
  })

  return Buffer.from(await pdfDoc.save())
}

export async function generateConvocationPdf(
  event: Record<string, any>,
  creator: Record<string, any>,
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 60

  page.drawText('NEXART', { x: 50, y, size: 22, font: fontBold, color: dark })
  page.drawText('nexart.fr', { x: width - 150, y, size: 10, font: fontRegular, color: gray })
  y -= 30
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 30
  page.drawText('CONFIRMATION DE PARTICIPATION', { x: 50, y, size: 16, font: fontBold, color: dark })
  y -= 18
  page.drawText(event.title || '', { x: 50, y, size: 12, font: fontRegular, color: dark })
  y -= 40

  const row = (label: string, value: string) => {
    page.drawText(`${label} :`, { x: 60, y, size: 9, font: fontBold, color: gray })
    page.drawText(value || '—', { x: 220, y, size: 9, font: fontRegular, color: black })
    y -= 16
  }

  const section = (title: string) => {
    y -= 8
    page.drawText(title, { x: 50, y, size: 10, font: fontBold, color: dark })
    y -= 4
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    y -= 14
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

  section('CONDITIONS FINANCIÈRES')
  row('Montant emplacement', event.stand_price ? `${(event.stand_price / 100).toFixed(2)} €` : 'Voir contrat')
  row('Dimensions stand', event.stand_dimensions || 'Voir contrat')

  y -= 30
  page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })
  y -= 16
  page.drawText('Ce document confirme votre participation. Présentez-le à l\'entrée.', {
    x: 50, y, size: 9, font: fontBold, color: dark,
  })
  y -= 13
  page.drawText(`Généré le ${new Date().toLocaleDateString('fr-FR')} via Nexart (nexart.fr)`, {
    x: 50, y, size: 8, font: fontRegular, color: gray,
  })
  y -= 11
  page.drawText(`Horodatage : ${new Date().toISOString()}`, {
    x: 50, y, size: 8, font: fontRegular, color: gray,
  })

  return Buffer.from(await pdfDoc.save())
}
