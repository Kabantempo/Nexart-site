import type { Metadata } from 'next'
import VerifyClient from './verify-client'

export const metadata: Metadata = {
  title: 'Vérification — Nexart',
  description: 'Vérification de document Nexart',
  robots: 'noindex',
}

export default function VerifyPage({ params }: { params: { token: string } }) {
  return <VerifyClient token={params.token} />
}
