import { Metadata } from 'next'
import { getAdminClient } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import OrganisateurProfileClient from './organisateur-profile-client'

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params
  const { data } = await getAdminClient()
    .from('profiles')
    .select('full_name, organizer_profiles(organization_name)')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Organisateur — Nexart' }
  const orgName = (data.organizer_profiles as any)?.[0]?.organization_name || data.full_name

  return {
    title: `${orgName} — Organisateur Nexart`,
    description: `Découvrez les événements organisés par ${orgName} sur Nexart.`,
    openGraph: {
      title: `${orgName} — Organisateur Nexart`,
      description: `Les marchés, pop-ups et salons de ${orgName}`,
      url: `https://nexart.fr/organisateurs/${id}`,
      type: 'profile',
    },
    alternates: { canonical: `https://nexart.fr/organisateurs/${id}` },
  }
}

export default async function OrganisateurPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const { data: profile } = await getAdminClient()
    .from('profiles')
    .select('id, full_name, role, organizer_profiles(organization_name, website, instagram, siret_verified)')
    .eq('id', id)
    .in('role', ['organizer', 'admin'])
    .single()

  if (!profile) notFound()

  return <OrganisateurProfileClient id={id} />
}
