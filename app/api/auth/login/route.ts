import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '@/lib/rate-limit'
import { getDeviceFingerprint, isKnownDevice, createVerificationCode } from '@/lib/device-auth'
import { logAudit } from '@/lib/audit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown'

  if (!rateLimit(`login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
      { status: 429 }
    )
  }

  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Champs manquants.' }, { status: 400 })
  }

  const ua = req.headers.get('user-agent') ?? 'unknown'
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }

  const userId = data.user.id
  const { ipHash, uaHash } = getDeviceFingerprint(req)
  const known = await isKnownDevice(userId, ipHash, uaHash)

  if (known) {
    logAudit({ userId, action: 'LOGIN_SUCCESS', resourceType: 'auth', ip, userAgent: ua })
    return NextResponse.json({ session: data.session })
  }

  // Appareil inconnu — envoyer un code de vérification
  logAudit({ userId, action: 'LOGIN_2FA_REQUIRED', resourceType: 'auth', description: 'New device detected', ip, userAgent: ua })
  const code = await createVerificationCode(userId, ipHash, uaHash)

  // Envoyer via Resend
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Nexart <noreply@nexart.fr>',
      to: email,
      subject: 'Code de vérification — Nouvelle connexion',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#1A1A1A;font-size:24px;margin-bottom:8px">Nouvelle connexion détectée</h2>
          <p style="color:#888;font-size:16px;margin-bottom:24px">
            Une connexion depuis un nouvel appareil a été détectée sur ton compte Nexart.<br>
            Entre ce code pour confirmer que c'est bien toi :
          </p>
          <div style="background:#F5F5F7;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <span style="font-size:40px;font-weight:700;letter-spacing:8px;color:#6366F1">${code}</span>
          </div>
          <p style="color:#9CA3AF;font-size:14px">
            Ce code expire dans <strong>10 minutes</strong>.<br>
            Si tu n'as pas tenté de connexion, change ton mot de passe immédiatement.
          </p>
        </div>
      `,
    }),
  })

  // Signer out la session créée (elle ne sera validée qu'après vérification)
  await supabase.auth.admin?.signOut(data.session.access_token).catch(() => {})

  return NextResponse.json(
    { requires_verification: true, user_id: userId, email },
    { status: 200 }
  )
}
