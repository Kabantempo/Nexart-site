import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import BoutiqueClient from './boutique-client'

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data: profile } = await supabaseServer.from('profiles').select('full_name').eq('id', id).single()
  const name = profile?.full_name || 'Créateur'
  return {
    title: `Boutique de ${name}`,
    description: `Découvrez les créations artisanales de ${name} sur Nexart.`,
  }
}

export default async function BoutiquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BoutiqueClient creatorId={id} />
}
