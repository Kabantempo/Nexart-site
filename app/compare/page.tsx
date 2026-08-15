import type { Metadata } from 'next'
import { Suspense } from 'react'
import CompareClient from './compare-client'

export const metadata: Metadata = {
  title: 'Comparer des marchés',
  description: 'Comparez jusqu\'à 3 marchés artisanaux côte à côte.',
}

export default function ComparePage() {
  return <Suspense><CompareClient /></Suspense>
}
