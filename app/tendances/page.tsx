import type { Metadata } from 'next'
import TendancesClient from './tendances-client'

export const metadata: Metadata = {
  title: 'Tendances — Nexart',
  description: 'Découvrez les tendances du marché artisanal : disciplines populaires, créateurs en vue et événements à venir.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://nexart.fr/tendances' },
  openGraph: { title: 'Tendances artisanales — Nexart', description: 'Disciplines populaires, créateurs en vue et événements à venir.', url: 'https://nexart.fr/tendances', type: 'website' },
}

export default function TendancesPage() { return <TendancesClient /> }
