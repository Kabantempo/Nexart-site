import type { Metadata } from 'next'
import { ErrorBoundary } from '@/components/error-boundary'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}
