import type { Metadata } from 'next'
import StripeSuccessClient from './success-client'

export const metadata: Metadata = {
  title: 'Paiement confirmé — Nexart',
  description: 'Votre paiement a bien été pris en compte.',
  robots: { index: false },
}

export default function StripeSuccessPage() {
  return <StripeSuccessClient />
}
