import type { Metadata } from 'next'
import ConditionsClient from './conditions-client'

export const metadata: Metadata = {
  title: 'Conditions d\'Utilisation',
  description: 'Conditions générales d\'utilisation de la plateforme Nexart. Rôles, tarifs, responsabilités, droits des utilisateurs.',
  alternates: { canonical: 'https://nexart.fr/conditions' },
  openGraph: {
    title: 'Conditions d\'Utilisation',
    description: 'Conditions générales d\'utilisation de la plateforme Nexart',
    url: 'https://nexart.fr/conditions',
    type: 'website',
    images: [{ url: 'https://nexart.fr/og-image.png', width: 1200, height: 630, alt: 'Nexart — Conditions d\'utilisation' }],
  },
}

export default function ConditionsPage() {
  return <ConditionsClient />
}
