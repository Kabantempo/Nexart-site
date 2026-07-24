export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

const VALID_TIERS = ['free', 'boost', 'pro', 'premium', 'org_pro', 'org_studio']

export async function POST(req: NextRequest) {
  const { requireAdmin } = await import('@/lib/require-admin')
  const check = await requireAdmin(req)
  if (!check.ok) return check.response
  const admin = getAdminClient()
  try {
    const { validate: v, z, uuidSchema } = await import('@/lib/validate')
    const schema = z.object({ user_id: uuidSchema, tier: z.enum(['free', 'boost', 'pro', 'premium', 'org_pro', 'org_studio']) })
    const { data, error: validErr } = v(schema, await req.json())
    if (validErr) return validErr
    const { user_id, tier } = data

    const { error } = await admin
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('id', user_id)

    if (error) {
      // Colonne pas encore créée → migration Stripe pas encore exécutée
      if (error.code === '42703' || (error instanceof Error ? error.message : String(error))?.includes('subscription_tier')) {
        return NextResponse.json({
          error: 'Colonne subscription_tier manquante. Exécutez la migration stripe_skeleton.sql dans Supabase SQL Editor.',
          migration_needed: true,
        }, { status: 503 })
      }
      return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) }, { status: 500 })
    }

    return NextResponse.json({ success: true, tier })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err)}, { status: 500 })
  }
}
