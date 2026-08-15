import type { Metadata } from 'next'
import AboutPageClient from './about-client'

export const metadata: Metadata = {
  title: 'À propos de Nexart',
  description: 'Nexart connecte créateurs artisanaux et organisateurs de marchés en France. Découvrez notre mission, nos valeurs et l\'équipe derrière le projet.',
  alternates: { canonical: 'https://nexart.fr/about' },
  openGraph: {
    title: 'À propos de Nexart',
    description: 'Nexart connecte créateurs artisanaux et organisateurs de marchés en France.',
    url: 'https://nexart.fr/about',
    type: 'website',
    images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — À propos' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'À propos de Nexart',
    description: 'Nexart connecte créateurs artisanaux et organisateurs de marchés en France.',
    images: ['https://nexart.fr/og-image.png'],
  },
}

export default function AboutPage() {
  return <AboutPageClient />
}
