import type { Metadata } from 'next'
import AdminClient from './admin-client'

export const metadata: Metadata = {
  title: 'Admin Panel — Nexart',
  description: 'Modération et gestion administrative',
  robots: 'noindex',
}

export default function AdminLayout() {
  return <AdminClient />
}
