import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import { getDeviceFingerprint, verifyCode, saveKnownDevice } from '@/lib/device-auth'
import { logAudit } from '@/lib/audit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  // 5 tentatives de code par 15 minutes par IP
  if (!rateLimit(`verify-device:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
      { status: 429 }
    )
  }

  const { user_id, email, password, code } = await req.json()

  if (!user_id || !email || !password || !code) {
    return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 })
  }

  const ua = req.headers.get('user-agent') ?? 'unknown'
  const { ipHash, uaHash } = getDeviceFingerprint(req)
  const valid = await verifyCode(user_id, code, ipHash, uaHash)

  if (!valid) {
    logAudit({ userId: user_id, action: 'DEVICE_VERIFY_FAILED', resourceType: 'auth', description: 'Invalid or expired 2FA code', ip, userAgent: ua })
    return NextResponse.json({ error: 'Code invalide ou expiré.' }, { status: 401 })
  }

  // Code valide — créer la vraie session et enregistrer l'appareil
  await saveKnownDevice(user_id, ipHash, uaHash)
  logAudit({ userId: user_id, action: 'DEVICE_VERIFIED', resourceType: 'auth', description: 'New device trusted after 2FA', ip, userAgent: ua })

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  return NextResponse.json({ session: data.session })
}
