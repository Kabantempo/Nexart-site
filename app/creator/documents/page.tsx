import type { Metadata } from 'next'
import DocumentsPageClient from './documents-client'

export const metadata: Metadata = {
  title: 'Mes documents — Nexart',
  description: 'Vos contrats, règlements et convocations',
}

export default function DocumentsPage() {
  return <DocumentsPageClient />
}
