export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { getAdminClient } from '@/lib/supabase-admin'

// POST /api/invoices/generate
// Génère une facture PDF pour un paiement Stripe ou une transaction crédit
export async function POST(req: NextRequest) {
  try {
    const admin = getAdminClient()

    // Auth requise
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    const { data: { user } } = await admin.auth.getUser(authHeader.substring(7))
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await req.json()
    const { transaction_id, application_id, event_id } = body

    if (!transaction_id && !application_id) {
      return NextResponse.json({ error: 'transaction_id ou application_id requis' }, { status: 400 })
    }

    // Récupérer les données nécessaires
    const [{ data: profile }, { data: application }] = await Promise.all([
      admin.from('profiles').select('full_name').eq('id', user.id).single(),
      application_id
        ? admin.from('applications').select('*, events(title, start_date, location, city, stand_price, organizer_id, organizer:profiles!organizer_id(full_name))').eq('id', application_id).single()
        : Promise.resolve({ data: null }),
    ])

    const eventData = (application as any)?.events
    const organizerName = (eventData as any)?.organizer?.full_name || 'Nexart'
    const eventTitle = eventData?.title || 'Événement Nexart'
    const eventDate = eventData?.start_date ? new Date(eventData.start_date).toLocaleDateString('fr-FR') : '—'
    const eventLocation = eventData ? `${eventData.location}, ${eventData.city}` : '—'
    const amount = eventData?.stand_price ? (eventData.stand_price / 100).toFixed(2) : '0.00'

    // Générer le PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([595, 842]) // A4
    const { width, height } = page.getSize()

    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const gray = rgb(0.4, 0.4, 0.4)
    const black = rgb(0, 0, 0)
    const dark = rgb(0.07, 0.07, 0.07)
    const indigo = rgb(0.39, 0.4, 0.945)

    let y = height - 60

    // En-tête
    page.drawText('NEXART', { x: 50, y, size: 22, font: fontBold, color: indigo })
    page.drawText('nexart.fr', { x: width - 150, y, size: 10, font: fontRegular, color: gray })

    y -= 14
    page.drawText('contact@nexart.fr', { x: width - 150, y, size: 9, font: fontRegular, color: gray })

    y -= 24
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.85, 0.85, 0.85) })

    y -= 28
    page.drawText('FACTURE', { x: 50, y, size: 16, font: fontBold, color: dark })

    const invoiceNum = `NX-${new Date().getFullYear()}-${transaction_id?.slice(-8).toUpperCase() || application_id?.slice(-8).toUpperCase() || 'XXXXX'}`
    page.drawText(`N° ${invoiceNum}`, { x: width - 200, y, size: 11, font: fontBold, color: dark })

    y -= 16
    const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    page.drawText(`Date d'émission : ${dateStr}`, { x: 50, y, size: 9, font: fontRegular, color: gray })

    // Adresses
    y -= 36
    page.drawText('ÉMETTEUR', { x: 50, y, size: 8, font: fontBold, color: gray })
    page.drawText('CLIENT', { x: 310, y, size: 8, font: fontBold, color: gray })

    y -= 14
    page.drawText('Nexart', { x: 50, y, size: 10, font: fontBold, color: dark })
    page.drawText(profile?.full_name || user.email || '—', { x: 310, y, size: 10, font: fontBold, color: dark })

    y -= 14
    page.drawText('contact@nexart.fr', { x: 50, y, size: 9, font: fontRegular, color: black })
    page.drawText(user.email || '—', { x: 310, y, size: 9, font: fontRegular, color: black })

    // Séparateur
    y -= 32
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

    // Tableau détail
    y -= 22
    page.drawRectangle({ x: 50, y: y - 4, width: width - 100, height: 22, color: rgb(0.97, 0.97, 0.97) })
    page.drawText('Description', { x: 58, y, size: 9, font: fontBold, color: gray })
    page.drawText('Quantité', { x: 360, y, size: 9, font: fontBold, color: gray })
    page.drawText('Montant HT', { x: 430, y, size: 9, font: fontBold, color: gray })
    page.drawText('Total', { x: 510, y, size: 9, font: fontBold, color: gray })

    y -= 24
    const description = `Emplacement — ${eventTitle}`
    const shortDesc = description.length > 55 ? description.slice(0, 52) + '…' : description
    page.drawText(shortDesc, { x: 58, y, size: 9, font: fontRegular, color: black })
    page.drawText('1', { x: 365, y, size: 9, font: fontRegular, color: black })
    page.drawText(`${amount} €`, { x: 432, y, size: 9, font: fontRegular, color: black })
    page.drawText(`${amount} €`, { x: 512, y, size: 9, font: fontRegular, color: black })

    y -= 12
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) })

    // Totaux
    y -= 18
    page.drawText('Sous-total HT :', { x: 390, y, size: 9, font: fontRegular, color: gray })
    page.drawText(`${amount} €`, { x: 510, y, size: 9, font: fontRegular, color: black })

    y -= 14
    const tvaLabel = process.env.TVA_LABEL ?? 'TVA (0% — non applicable)'
    page.drawText(`${tvaLabel} :`, { x: 340, y, size: 9, font: fontRegular, color: gray })
    page.drawText('0.00 €', { x: 510, y, size: 9, font: fontRegular, color: black })

    y -= 14
    page.drawLine({ start: { x: 380, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })

    y -= 16
    page.drawText('TOTAL TTC :', { x: 390, y, size: 10, font: fontBold, color: dark })
    page.drawText(`${amount} €`, { x: 510, y, size: 10, font: fontBold, color: dark })

    // Détails événement
    y -= 40
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
    y -= 18
    page.drawText('DÉTAILS DE LA PRESTATION', { x: 50, y, size: 9, font: fontBold, color: gray })

    const detail = (label: string, value: string) => {
      y -= 14
      page.drawText(`${label} :`, { x: 58, y, size: 8.5, font: fontBold, color: gray })
      page.drawText(value, { x: 180, y, size: 8.5, font: fontRegular, color: black })
    }

    detail('Événement', eventTitle)
    detail('Date', eventDate)
    detail('Lieu', eventLocation)
    detail('Organisateur', organizerName)
    if (application_id) detail('Référence dossier', application_id.slice(0, 8).toUpperCase())

    // Pied de page
    y -= 50
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) })
    y -= 16
    page.drawText('Nexart — Marketplace artisanale — nexart.fr — contact@nexart.fr', {
      x: 50, y, size: 8, font: fontRegular, color: gray,
    })
    y -= 12
    page.drawText('Document généré automatiquement. Conservez-le pour votre comptabilité.', {
      x: 50, y, size: 7.5, font: fontRegular, color: rgb(0.6, 0.6, 0.6),
    })

    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = Buffer.from(pdfBytes)

    // Upload dans Supabase Storage (optionnel, ne bloque pas si échoue)
    const fileName = `invoices/${user.id}/${invoiceNum}.pdf`
    await admin.storage.from('invoices').upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true }).catch(() => {})

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-nexart-${invoiceNum}.pdf"`,
      },
    })
  } catch (error: unknown) {
    console.error('[invoices/generate]', error)
    return NextResponse.json({ error: 'Erreur génération facture' }, { status: 500 })
  }
}
