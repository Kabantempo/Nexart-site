import type { Metadata } from 'next'
import PersonnaliserClient from './personnaliser-client'

export const metadata: Metadata = {
  title: 'Personnaliser ma page — Nexart',
  description: 'Customise les couleurs, la police, les sections et le portfolio de ta page créateur.',
  robots: { index: false },
}

export default function PersonnaliserPage() {
  return <PersonnaliserClient />
}
