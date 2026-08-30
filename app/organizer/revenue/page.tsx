import type { Metadata } from 'next'
import RevenueClient from './revenue-client'

export const metadata: Metadata = {
  title: 'Revenus — Nexart',
  description: 'Suivi des paiements stands et revenus par événement',
  alternates: { canonical: 'https://nexart.fr/organizer/revenue' },
  openGraph: {
    title: 'Revenus — Nexart',
    description: 'Suivi des paiements stands et revenus par événement',
    url: 'https://nexart.fr/organizer/revenue',
    type: 'website',
  },
}

export default function OrganizerRevenuePage() {
  return <RevenueClient />
}
