import { redirect, notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function UsernamePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const { data } = await supabaseServer
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (!data) notFound()
  redirect(`/creators/${data.id}`)
}
