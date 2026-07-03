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
  },
}

export default function CreatorsPage() {
  return <CreatorsClient />
}
