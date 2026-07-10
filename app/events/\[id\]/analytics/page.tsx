import type { Metadata } from 'next'
import EventAnalyticsClient from './analytics-client'

export const metadata: Metadata = {
  title: 'Analytics — Nexart',
  description: 'Event analytics and statistics',
}

export default function EventAnalyticsPage({ params }: { params: { id: string } }) {
  return <EventAnalyticsClient eventId={params.id} />
}
