import type { Metadata } from 'next'
import StripeSuccessClient from './success-client'

export const metadata: Metadata = {
  title: 'Paiement confirmé — Nexart',
  description: 'Votre paiement a été accepté avec succès.',
  robots: { index: false, follow: false },
}

export default function StripeSuccessPage() {
  return <StripeSuccessClient />
}
