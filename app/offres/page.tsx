import type { Metadata } from 'next'
import OffresPageClient from './offres-client'

export const metadata: Metadata = {
  title: 'Tarifs & offres — Nexart',
  description: 'Découvrez les offres Nexart pour créateurs et organisateurs. Gratuit pour toujours pour les créateurs, plans premium pour les organisateurs professionnels.',
  alternates: { canonical: 'https://nexart.fr/offres' },
  openGraph: {
    title: 'Tarifs & offres — Nexart',
    description: 'Découvrez les offres Nexart pour créateurs et organisateurs.',
    url: 'https://nexart.fr/offres',
    type: 'website',
  },
}

export default function OffresPage() {
  return <OffresPageClient />
}
