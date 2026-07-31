import type { Metadata } from 'next'
import CalendrierClient from './calendrier-client'

export const metadata: Metadata = {
  title: { absolute: 'Calendrier des événements — Nexart' },
  description: 'Consultez le calendrier des marchés artisanaux et événements créateurs partout en France.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://nexart.fr/calendrier' },
  openGraph: { title: 'Calendrier des marchés artisanaux — Nexart', description: 'Tous les marchés et événements créateurs en France.', url: 'https://nexart.fr/calendrier', type: 'website', images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Calendrier des marchés artisanaux' }] },
}

export default function CalendrierPage() { return <CalendrierClient /> }
