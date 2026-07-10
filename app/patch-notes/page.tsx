import type { Metadata } from 'next'
import PatchNotesClient from './patch-notes-client'

export const metadata: Metadata = {
  title: 'Patch Notes — Nexart',
  description: 'Découvrez les dernières mises à jour et nouvelles fonctionnalités de Nexart',
  alternates: { canonical: 'https://nexart.fr/patch-notes' },
  openGraph: {
    title: 'Patch Notes — Nexart',
    description: 'Découvrez les dernières mises à jour de Nexart',
    url: 'https://nexart.fr/patch-notes',
    type: 'website',
  },
}

export default function PatchNotesPage() {
  return <PatchNotesClient />
}
