import type { Metadata } from 'next'
import CreateEventClient from './create-client'

export const metadata: Metadata = {
  title: 'Créer un marché — Nexart',
  description: 'Créez votre événement artisanal sur Nexart et trouvez les meilleurs créateurs pour y participer.',
  alternates: { canonical: 'https://nexart.fr/events/create' },
  openGraph: {
    title: 'Créer un marché — Nexart',
    description: 'Créez votre événement artisanal sur Nexart et trouvez les meilleurs créateurs pour y participer.',
    url: 'https://nexart.fr/events/create',
    type: 'website',
  },
}

export default function CreateEventPage() {
  return <CreateEventClient />
}
