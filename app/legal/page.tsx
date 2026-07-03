import type { Metadata } from 'next'
import LegalPageClient from './legal-client'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de la plateforme Nexart.',
  alternates: { canonical: 'https://nexart.fr/legal' },
  robots: { index: false, follow: false },
}

export default function LegalPage() {
  return <LegalPageClient />
}
