import EditEventClient from './edit-client'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditEventClient eventId={id} />
}
