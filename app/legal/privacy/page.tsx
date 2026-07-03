import type { Metadata } from 'next'
import PrivacyPageClient from './legal-client'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et de traitement des données personnelles de Nexart.',
  alternates: { canonical: 'https://nexart.fr/legal/privacy' },
  robots: { index: true, follow: false },
}

export default function PrivacyPage() {
  return <PrivacyPageClient />
}
