import type { Metadata } from 'next'
import CompareClient from './compare-client'

export const metadata: Metadata = {
  title: 'Comparer des marchés — Nexart',
  description: 'Comparez jusqu\'à 3 marchés artisanaux côte à côte.',
}

export default function ComparePage() {
  return <CompareClient />
}
