import type { Metadata } from 'next'
import CarteClient from './carte-client'

export const metadata: Metadata = {
  title: 'Carte des événements',
  description: 'Explorez la carte interactive des marchés artisanaux, pop-ups et salons près de chez vous partout en France. Filtrez par ville ou région.',
  alternates: { canonical: 'https://nexart.fr/carte' },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Carte des marchés artisanaux — Nexart',
    description: 'Explorez la carte interactive des marchés artisanaux et événements créateurs partout en France.',
    url: 'https://nexart.fr/carte',
    type: 'website',
    images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Carte des événements' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Carte des marchés artisanaux — Nexart',
    description: 'Explorez la carte interactive des marchés artisanaux et événements créateurs partout en France.',
    images: ['https://nexart.fr/og-image.png'],
  },
}

export default function CartePage() {
  return <CarteClient />
}
