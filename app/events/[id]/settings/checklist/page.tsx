import type { Metadata } from 'next'
import ChecklistClient from './checklist-client'

export const metadata: Metadata = {
  title: 'Checklist Événement — Nexart',
  description: 'Suivez les tâches essentielles pour préparer votre événement',
  robots: 'noindex',
}

export default function ChecklistPage({ params }: { params: { id: string } }) {
  return <ChecklistClient eventId={params.id} />
}
