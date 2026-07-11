import type { Metadata } from 'next'
import ConditionsClient from './conditions-client'

export const metadata: Metadata = {
  title: 'Conditions d\'Utilisation — Nexart',
  description: 'Conditions générales d\'utilisation de la plateforme Nexart. Rôles, tarifs, responsabilités, droits des utilisateurs.',
  alternates: { canonical: 'https://nexart.fr/conditions' },
  openGraph: {
    title: 'Conditions d\'Utilisation — Nexart',
    description: 'Conditions générales d\'utilisation de la plateforme Nexart',
    url: 'https://nexart.fr/conditions',
    type: 'website',
  },
}

export default function ConditionsPage() {
  return <ConditionsClient />
}
