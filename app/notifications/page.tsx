import type { Metadata } from 'next'
import NotificationsClient from './notifications-client'

export const metadata: Metadata = {
  title: 'Notifications — Nexart',
  description: 'Restez informé de toutes vos activités sur Nexart.',
  alternates: { canonical: 'https://nexart.fr/notifications' },
  openGraph: {
    title: 'Notifications — Nexart',
    description: 'Restez informé de toutes vos activités sur Nexart.',
    url: 'https://nexart.fr/notifications',
    type: 'website',
  },
}

export default function NotificationsPage() {
  return <NotificationsClient />
}
