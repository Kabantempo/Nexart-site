export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { getStripe, isStripeConfigured } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe non configuré' }, { status: 503 })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const admin = getAdminClient()
    const { data: { user: authUser }, error: authError } = await admin.auth.getUser(authHeader.substring(7))
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
    }

    const { validate: v, z } = await import('@/lib/validate')
    const schema = z.object({
      returnUrl: z.string().url().refine(
        url => url.startsWith(process.env.NEXT_PUBLIC_APP_URL || 'https://nexart.fr'),
        'URL de retour invalide'
      ),
    })
    const { data: parsed, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { returnUrl } = parsed

    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', authUser.id).single() as any
    if (!(profile as any)?.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun abonnement trouvé' }, { status: 404 })
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: (profile as any).stripe_customer_id,
      return_url: returnUrl ?? `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexart.fr'}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/portal]', err)
    return NextResponse.json({ error: 'Erreur portail Stripe' }, { status: 500 })
  }
}
