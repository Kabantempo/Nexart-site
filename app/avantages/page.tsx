import type { Metadata } from 'next'
import AvantagesClient from './avantages-client'

export const metadata: Metadata = {
  title: 'Avantages — Nexart',
  description: 'Parrainage, crédits et offres exclusives pour les créateurs Nexart.',
  alternates: { canonical: 'https://nexart.fr/avantages' },
}

export default function AvantagesPage() {
  return <AvantagesClient />
}
