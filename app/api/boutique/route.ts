import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// GET /api/boutique?creator_id=xxx
export async function GET(req: NextRequest) {
  const creatorId = req.nextUrl.searchParams.get('creator_id')
  if (!creatorId) return NextResponse.json({ error: 'creator_id requis' }, { status: 400 })

  const { data, error } = await admin.from('products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('is_available', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data })
}

// POST /api/boutique — créer un produit
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { creator_id, title, description, price, images, category, stock, featured_event_id } = body

  if (!creator_id || !title || !price) {
    return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
  }

  // Vérifier limit plan (20 items pour Pro, 50 pour Premium) - sera géré via subscription_tier
  const { count } = await admin.from('products')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', creator_id)

  const { data: profile } = await admin.from('profiles')
    .select('subscription_tier')
    .eq('id', creator_id)
    .single()

  const tier = profile?.subscription_tier || 'free'
  const limit = tier === 'premium' ? 50 : tier === 'pro' ? 20 : 0

  if (limit === 0) {
    return NextResponse.json({ error: 'La boutique créateur est réservée aux abonnés Pro et Premium' }, { status: 403 })
  }
  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: `Limite de ${limit} produits atteinte pour votre plan` }, { status: 403 })
  }

  const { data, error } = await admin.from('products').insert({
    creator_id, title, description, price, images: images || [],
    category, stock: stock ?? 1, is_available: true,
    featured_event_id: featured_event_id || null,
    featured_until: featured_event_id ? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString() : null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data }, { status: 201 })
}

// PATCH /api/boutique — mettre à jour un produit
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, creator_id, ...updates } = body

  if (!id || !creator_id) {
    return NextResponse.json({ error: 'id et creator_id requis' }, { status: 400 })
  }

  const { data, error } = await admin.from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('creator_id', creator_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data })
}

// DELETE /api/boutique?id=xxx&creator_id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  const creatorId = req.nextUrl.searchParams.get('creator_id')

  if (!id || !creatorId) return NextResponse.json({ error: 'id et creator_id requis' }, { status: 400 })

  const { error } = await admin.from('products').delete().eq('id', id).eq('creator_id', creatorId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
