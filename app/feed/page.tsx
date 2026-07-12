import type { Metadata } from 'next'
import FeedClient from './feed-client'

export const metadata: Metadata = {
  title: { absolute: "Fil d'actualité — Nexart" },
  description: "Suivez l'actualité des créateurs artisanaux sur Nexart : publications, collaborations et événements.",
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://nexart.fr/feed' },
  openGraph: { title: "Fil d'actualité artisanal — Nexart", description: 'Publications, collaborations et événements des créateurs.', url: 'https://nexart.fr/feed', type: 'website' },
}

export default function FeedPage() { return <FeedClient /> }
