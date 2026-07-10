import type { Metadata } from 'next'
import RemindersClient from './reminders-client'

export const metadata: Metadata = {
  title: 'Paramètres Relances — Nexart',
  description: 'Configurez les relances automatiques pour vos exposants',
  robots: 'noindex',
}

export default function RemindersPage({ params }: { params: { id: string } }) {
  return <RemindersClient eventId={params.id} />
}
