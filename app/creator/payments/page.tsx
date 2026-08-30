import type { Metadata } from 'next'
import PaymentsClient from './payments-client'

export const metadata: Metadata = {
  title: 'Mes paiements — Nexart',
  description: 'Historique de vos paiements stands et téléchargement des reçus',
  alternates: { canonical: 'https://nexart.fr/creator/payments' },
}

export default function CreatorPaymentsPage() {
  return <PaymentsClient />
}
