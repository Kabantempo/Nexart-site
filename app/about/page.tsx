import type { Metadata } from 'next'
import AboutPageClient from './about-client'

export const metadata: Metadata = {
  title: 'À propos de Nexart',
  description: 'Nexart est la marketplace qui connecte créateurs artisanaux et organisateurs de marchés en France. Découvrez notre mission, nos valeurs et l\'équipe derrière le projet.',
  alternates: { canonical: 'https://nexart.fr/about' },
  openGraph: {
    title: 'À propos de Nexart',
    description: 'Nexart connecte créateurs artisanaux et organisateurs de marchés en France.',
    url: 'https://nexart.fr/about',
    type: 'website',
  },
}

export default function AboutPage() {
  return <AboutPageClient />
}
