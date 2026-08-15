export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 })
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const token = authHeader.slice(7)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const admin = getAdminClient()
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('role, is_organizer')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_organizer && profile?.role !== 'organizer') {
    return NextResponse.json({ error: 'Réservé aux organisateurs' }, { status: 403 })
  }

  const { data: orgProfile } = await (admin as any)
    .from('organizer_profiles')
    .select('stripe_account_id, stripe_connect_status')
    .eq('user_id', user.id)
    .maybeSingle()

  const stripe = getStripe()
  let accountId = orgProfile?.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { supabase_user_id: user.id },
    })
    accountId = account.id

    await (admin as any).from('organizer_profiles').upsert({
      user_id: user.id,
      stripe_account_id: accountId,
      stripe_connect_status: 'pending',
    }, { onConflict: 'user_id' })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexart.fr'
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/dashboard?stripe_connect=refresh`,
    return_url: `${appUrl}/api/stripe/connect/return?account=${accountId}&user=${user.id}`,
    type: 'account_onboarding',
  })

  return NextResponse.json({ url: accountLink.url })
}
