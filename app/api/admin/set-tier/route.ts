export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const VALID_TIERS = ['free', 'boost', 'pro', 'premium', 'org_pro', 'org_studio']

export async function POST(req: NextRequest) {
  const admin = getAdminClient()
  try {
    const { user_id, tier } = await req.json()

    if (!user_id || !tier) {
      return NextResponse.json({ error: 'user_id et tier requis' }, { status: 400 })
    }
    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: 'Tier invalide' }, { status: 400 })
    }

    const { error } = await admin
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('id', user_id)

    if (error) {
      // Colonne pas encore créée → migration Stripe pas encore exécutée
      if (error.code === '42703' || error.message?.includes('subscription_tier')) {
        return NextResponse.json({
          error: 'Colonne subscription_tier manquante. Exécutez la migration stripe_skeleton.sql dans Supabase SQL Editor.',
          migration_needed: true,
        }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tier })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, { status: 500 })
  }
}
