import type { Metadata } from 'next'
import FavoritesClient from './favorites-client'

export const metadata: Metadata = {
  title: 'Mes favoris — Nexart',
  description: 'Retrouvez vos créateurs et marchés artisanaux favoris sauvegardés sur Nexart.',
  alternates: { canonical: 'https://nexart.fr/favorites' },
  openGraph: {
    title: 'Mes favoris — Nexart',
    description: 'Retrouvez vos créateurs et marchés artisanaux favoris sauvegardés sur Nexart.',
    url: 'https://nexart.fr/favorites',
    type: 'website',
  },
}

export default function FavoritesPage() {
  return <FavoritesClient />
}
