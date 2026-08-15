export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('account')
  const userId = searchParams.get('user')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexart.fr'

  if (!accountId || !userId) {
    return NextResponse.redirect(`${appUrl}/dashboard?stripe_connect=error`)
  }

  if (!isStripeConfigured()) {
    return NextResponse.redirect(`${appUrl}/dashboard?stripe_connect=error`)
  }

  try {
    const stripe = getStripe()
    const account = await stripe.accounts.retrieve(accountId)

    let status: 'active' | 'restricted' | 'pending'
    if (account.charges_enabled && account.payouts_enabled) {
      status = 'active'
    } else if (account.details_submitted) {
      status = 'restricted'
    } else {
      status = 'pending'
    }

    const admin = getAdminClient()
    const { data: existing } = await (admin as any)
      .from('organizer_profiles')
      .select('stripe_connect_status, stripe_connect_onboarded_at')
      .eq('user_id', userId)
      .maybeSingle()

    const wasAlreadyActive = existing?.stripe_connect_status === 'active'

    await (admin as any).from('organizer_profiles').upsert({
      user_id: userId,
      stripe_account_id: accountId,
      stripe_connect_status: status,
      ...(status === 'active' && !wasAlreadyActive ? { stripe_connect_onboarded_at: new Date().toISOString() } : {}),
    }, { onConflict: 'user_id' })

    if (status === 'active' && !wasAlreadyActive) {
      await admin.from('notifications').insert({
        user_id: userId,
        type: 'stripe_connect_active',
        title: '✅ Paiements directs activés',
        body: 'Votre compte Stripe Connect est validé. Les paiements de stands vous sont maintenant versés directement.',
        link: '/dashboard',
      })
    }

    return NextResponse.redirect(`${appUrl}/dashboard?stripe_connect=${status}`)
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard?stripe_connect=error`)
  }
}
