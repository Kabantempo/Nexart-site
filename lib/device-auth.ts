import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function hash(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export function getDeviceFingerprint(req: { headers: { get: (k: string) => string | null } }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const ua = req.headers.get('user-agent') ?? 'unknown'
  return { ipHash: hash(ip), uaHash: hash(ua) }
}

export async function isKnownDevice(userId: string, ipHash: string, uaHash: string): Promise<boolean> {
  const { data } = await admin
    .from('user_known_devices')
    .select('id')
    .eq('user_id', userId)
    .eq('ip_hash', ipHash)
    .eq('ua_hash', uaHash)
    .single()

  if (data) {
    // Update last seen
    await admin.from('user_known_devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', data.id)
    return true
  }
  return false
}

export async function saveKnownDevice(userId: string, ipHash: string, uaHash: string) {
  await admin.from('user_known_devices').upsert(
    { user_id: userId, ip_hash: ipHash, ua_hash: uaHash, last_seen_at: new Date().toISOString() },
    { onConflict: 'user_id,ip_hash,ua_hash' }
  )
}

export async function createVerificationCode(userId: string, ipHash: string, uaHash: string): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const codeHash = hash(code)

  // Invalider les anciens codes
  await admin.from('device_verification_codes')
    .update({ used: true })
    .eq('user_id', userId)
    .eq('used', false)

  await admin.from('device_verification_codes').insert({
    user_id: userId,
    code_hash: codeHash,
    ip_hash: ipHash,
    ua_hash: uaHash,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  })

  return code
}

export async function verifyCode(
  userId: string, code: string, ipHash: string, uaHash: string
): Promise<boolean> {
  const codeHash = hash(code)

  const { data } = await admin
    .from('device_verification_codes')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('code_hash', codeHash)
    .eq('ip_hash', ipHash)
    .eq('ua_hash', uaHash)
    .eq('used', false)
    .single()

  if (!data) return false
  if (new Date(data.expires_at) < new Date()) return false

  await admin.from('device_verification_codes').update({ used: true }).eq('id', data.id)
  return true
}
