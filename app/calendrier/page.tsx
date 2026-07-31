import type { Metadata } from 'next'
import CalendrierClient from './calendrier-client'

export const metadata: Metadata = {
  title: { absolute: 'Calendrier des événements — Nexart' },
  description: 'Consultez le calendrier des marchés artisanaux et événements créateurs partout en France. Planifiez vos prochaines candidatures par date et région.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://nexart.fr/calendrier' },
  openGraph: {
    title: 'Calendrier des marchés artisanaux — Nexart',
    description: 'Tous les marchés et événements créateurs en France, organisés par date.',
    url: 'https://nexart.fr/calendrier',
    type: 'website',
    images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Calendrier des marchés artisanaux' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calendrier des marchés artisanaux — Nexart',
    description: 'Tous les marchés et événements créateurs en France, organisés par date.',
    images: ['https://nexart.fr/og-image.png'],
  },
}

export default function CalendrierPage() { return <CalendrierClient /> }
