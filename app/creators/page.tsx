import type { Metadata } from 'next'
import { Suspense } from 'react'
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
  twitter: {
    card: 'summary_large_image',
    title: 'Créateurs & artisans — Portfolios',
    description: 'Découvrez les créateurs et artisans référencés sur Nexart.',
    images: ['https://nexart.fr/og-image.png'],
  },
}

export default function CreatorsPage() {
  return <Suspense><CreatorsClient /></Suspense>
}
