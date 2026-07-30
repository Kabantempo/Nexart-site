import type { Metadata } from 'next'
import CreatorsClient from './creators-client'

export const metadata: Metadata = {
  title: 'Créateurs & artisans — Portfolios',
  description: 'Découvrez les créateurs et artisans référencés sur Nexart : céramistes, illustrateurs, bijoutiers, sculpteurs et bien plus. Explorez leurs portfolios.',
  alternates: { canonical: 'https://nexart.fr/creators' },
  openGraph: {
    title: 'Créateurs & artisans — Portfolios',
    description: 'Découvrez les créateurs et artisans référencés sur Nexart.',
    url: 'https://nexart.fr/creators',
    type: 'website',
    images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Créateurs & artisans' }],
  },
}

export default function CreatorsPage() {
  return <CreatorsClient />
}
