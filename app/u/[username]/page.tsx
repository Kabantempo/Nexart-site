import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params
  return { title: `@${username}`, robots: { index: false, follow: true } }
}

export default async function UsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (!data) notFound()
  redirect(`/creators/${data.id}`)
}
