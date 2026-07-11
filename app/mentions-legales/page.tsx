import type { Metadata } from 'next'
import MentionsLegalesClient from './mentions-legales-client'

export const metadata: Metadata = {
  title: 'Mentions Légales — Nexart',
  description: 'Informations légales de Nexart SAS - SIRET, hébergeur, directeur publication.',
  alternates: { canonical: 'https://nexart.fr/mentions-legales' },
  openGraph: {
    title: 'Mentions Légales — Nexart',
    description: 'Informations légales de Nexart SAS',
    url: 'https://nexart.fr/mentions-legales',
    type: 'website',
  },
}

export default function MentionsLegalesPage() {
  return <MentionsLegalesClient />
}
