import StandsClient from './stands-client'

export default function StandsPage({ params }: { params: { id: string } }) {
  return <StandsClient eventId={params.id} />
}
