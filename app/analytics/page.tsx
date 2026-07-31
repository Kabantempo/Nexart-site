import type { Metadata } from 'next'
import AnalyticsClient from './analytics-client'

export const metadata: Metadata = {
  title: 'Mes statistiques — Nexart',
  description: 'Suivez vos performances sur Nexart : vues de profil, candidatures, taux d\'acceptation.',
  alternates: { canonical: 'https://nexart.fr/analytics' },
  openGraph: {
    title: 'Mes statistiques — Nexart',
    description: 'Suivez vos performances sur Nexart : vues de profil, candidatures, taux d\'acceptation.',
    url: 'https://nexart.fr/analytics',
    type: 'website',
  },
}

export default function AnalyticsPage() {
  return <AnalyticsClient />
}
