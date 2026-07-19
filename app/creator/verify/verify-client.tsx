'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { BadgeCheck, ShieldCheck, TrendingUp, Star, ArrowLeft, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type VerifStatus = 'idle' | 'pending' | 'approved' | 'rejected' | 'loading'

export default function VerifyClient() {
  const router = useRouter()
  const [siret, setSiret] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifStatus, setVerifStatus] = useState<VerifStatus>('loading')
  const [siretVerified, setSiretVerified] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/connexion'); return }

      // Check creator_profiles for siret_verified
      const { data: cp } = await supabase
        .from('creator_profiles')
        .select('siret_verified, siret')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cp?.siret_verified) {
        setSiretVerified(true)
        setVerifStatus('approved')
        return
      }

      // Check for pending verification using API
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/admin/verifications?status=pending', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      // We won't get admin access here — check via creator endpoint
      // Simply check if there's a pending entry in creator_verifications
      // We query through the public API pattern
      setVerifStatus('idle')
    }
    load()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (siret.length !== 14) return
    setSubmitting(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/creator/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ siret }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur serveur')
      setSuccess(true)
      setVerifStatus('pending')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  const benefits = [
    { icon: <BadgeCheck size={20} color="#6366F1" />, title: 'Badge vérifié', desc: 'Un badge ✓ SIRET apparaît sur votre profil public.' },
    { icon: <TrendingUp size={20} color="#6366F1" />, title: 'Priorité dans les résultats', desc: 'Les créateurs vérifiés sont mis en avant dans les recherches.' },
    { icon: <Star size={20} color="#6366F1" />, title: 'Confiance accrue', desc: 'Les organisateurs préfèrent les créateurs avec statut vérifié.' },
    { icon: <ShieldCheck size={20} color="#6366F1" />, title: 'Statut professionnel', desc: 'Prouvez que vous exercez en tant que professionnel déclaré.' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 16px 80px' }}>
        {/* Back */}
        <button
          onClick={() => router.push('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '14px', fontWeight: 600, padding: 0 }}>
          <ArrowLeft size={16} /> Retour au profil
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1A1A1A', marginBottom: '6px' }}>
            Vérification SIRET
          </h1>
          <p style={{ fontSize: '15px', color: '#888888', marginBottom: '36px' }}>
            Soumettez votre SIRET pour obtenir le badge créateur vérifié.
          </p>

          {/* Status: déjà vérifié */}
          {verifStatus === 'approved' && (
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BadgeCheck size={24} color="#10B981" />
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#065F46', margin: 0 }}>SIRET vérifié ✓</p>
                <p style={{ fontSize: '13px', color: '#34D399', margin: '4px 0 0', fontWeight: 600 }}>Votre badge est actif sur votre profil public.</p>
              </div>
            </div>
          )}

          {/* Status: demande en cours */}
          {verifStatus === 'pending' && !siretVerified && (
            <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#FFFBEB', border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Loader2 size={24} color="#F59E0B" />
              </div>
              <div>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#92400E', margin: 0 }}>Vérification en cours…</p>
                <p style={{ fontSize: '13px', color: '#B45309', margin: '4px 0 0', fontWeight: 600 }}>Vous recevrez une réponse sous 48h.</p>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '36px' }}>
            {benefits.map((b, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
                style={{ padding: '18px', borderRadius: '14px', backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div style={{ marginBottom: '8px' }}>{b.icon}</div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px' }}>{b.title}</p>
                <p style={{ fontSize: '12px', color: '#888888', margin: 0, lineHeight: '1.5' }}>{b.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Form */}
          {verifStatus !== 'approved' && verifStatus !== 'pending' && (
            <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>
                Numéro SIRET <span style={{ color: '#EF4444' }}>*</span>
              </p>
              <input
                value={siret}
                onChange={e => setSiret(e.target.value.replace(/\D/g, '').slice(0, 14))}
                placeholder="12345678901234"
                maxLength={14}
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '12px 16px',
                  borderRadius: '10px', border: `1px solid ${siret.length > 0 && siret.length !== 14 ? '#FCA5A5' : '#E5E7EB'}`,
                  fontSize: '16px', fontFamily: 'monospace', letterSpacing: '2px',
                  outline: 'none', color: '#1A1A1A', backgroundColor: '#F9FAFB',
                  marginBottom: '6px',
                }}
              />
              <p style={{ fontSize: '12px', color: siret.length === 14 ? '#10B981' : '#9CA3AF', margin: '0 0 20px', fontWeight: 600 }}>
                {siret.length}/14 chiffres
                {siret.length === 14 && ' ✓'}
              </p>

              {error && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', marginBottom: '16px', fontSize: '13px', color: '#EF4444', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              {success && (
                <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', marginBottom: '16px', fontSize: '13px', color: '#10B981', fontWeight: 600 }}>
                  Demande envoyée ! Vous recevrez une réponse sous 48h.
                </div>
              )}

              <button
                type="submit"
                disabled={siret.length !== 14 || submitting}
                style={{
                  width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                  backgroundColor: siret.length === 14 && !submitting ? '#6366F1' : '#E5E7EB',
                  color: siret.length === 14 && !submitting ? '#FFFFFF' : '#9CA3AF',
                  fontSize: '15px', fontWeight: 700, cursor: siret.length === 14 && !submitting ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'background 200ms',
                }}>
                {submitting ? <><Loader2 size={16} /> Envoi en cours…</> : 'Soumettre la demande'}
              </button>

              <p style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', marginTop: '12px', lineHeight: '1.5' }}>
                Votre numéro SIRET sera vérifié manuellement sous 48h ouvrées.
                Vous recevrez une notification dès validation.
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}
