import type { Metadata } from 'next'
import DocumentsClient from './documents-client'

export const metadata: Metadata = {
  title: 'Mes documents — Nexart',
  description: 'Retrouvez vos contrats et documents liés à vos participations.',
  alternates: { canonical: 'https://nexart.fr/creator/documents' },
}

export default function DocumentsPage() {
  return <DocumentsClient />
}
