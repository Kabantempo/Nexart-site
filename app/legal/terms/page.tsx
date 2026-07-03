import type { Metadata } from 'next'
import TermsPageClient from './legal-client'

export const metadata: Metadata = {
  title: 'Conditions générales d\'utilisation',
  description: 'Conditions générales d\'utilisation de la plateforme Nexart.',
  alternates: { canonical: 'https://nexart.fr/legal/terms' },
  robots: { index: true, follow: false },
}

export default function TermsPage() {
  return <TermsPageClient />
}
