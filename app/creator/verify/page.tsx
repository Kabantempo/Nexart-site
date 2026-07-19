import type { Metadata } from 'next'
import VerifyClient from './verify-client'

export const metadata: Metadata = {
  title: 'Vérification SIRET — Nexart',
  description: 'Faites vérifier votre SIRET pour obtenir le badge créateur vérifié sur Nexart.',
}

export default function VerifyPage() {
  return <VerifyClient />
}
