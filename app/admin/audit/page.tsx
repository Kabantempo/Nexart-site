import type { Metadata } from 'next'
import AuditLogsClient from './audit-client'

export const metadata: Metadata = {
  title: 'Audit Logs — Admin Nexart',
  robots: { index: false, follow: false },
}

export default function AuditLogsPage() {
  return <AuditLogsClient />
}
