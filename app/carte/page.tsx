import type { Metadata } from 'next'
import CarteClient from './carte-client'

export const metadata: Metadata = {
  title: 'Carte des événements',
  description: 'Explorez les marchés artisanaux et événements créateurs près de chez vous sur la carte interactive Nexart.',
  robots: { index: true, follow: true },
}

export default function CartePage() {
  return <CarteClient />
}
