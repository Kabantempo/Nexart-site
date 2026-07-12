import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getAdminClient } from '@/lib/supabase-admin'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username} — Nexart`, robots: { index: false, follow: true } }
}

export default async function UsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const { data } = await getAdminClient()
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (!data) notFound()
  redirect(`/creators/${data.id}`)
}
