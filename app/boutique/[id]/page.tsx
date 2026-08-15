import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import BoutiqueClient from './boutique-client'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', id).single()
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
