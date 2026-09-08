'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'
import { Gift, Users, Copy, Check, ArrowLeft, Star, Zap } from 'lucide-react'

const CreditsWidget = dynamic(() => import('@/components/credits-widget').then(m => ({ default: m.CreditsWidget })), { ssr: false })

export default function AvantagesClient() {
  const router = useRouter()
  const [code, setCode] = useState<string | null>(null)
  const [credited, setCredited] = useState(0)
  const [pending, setPending] = useState(0)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      const res = await fetch('/api/referral', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCode(data.code)
        setCredited(data.credited ?? 0)
        setPending(data.pending ?? 0)
      }
      setLoading(false)
    }
    load()
  }, [router])

  const referralUrl = code
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://nexart.fr'}/?ref=${code}`
    : ''

  const handleCopy = () => {
    if (!referralUrl) return
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', backgroundColor: colors.bg.primary, padding: '32px 16px 60px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: colors.text.secondary, textDecoration: 'none', marginBottom: '16px' }}>
            <ArrowLeft size={14} /> Tableau de bord
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: `rgba(99,102,241,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={18} color={colors.violet.primary} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: colors.text.primary, margin: 0 }}>Avantages</h1>
              <p style={{ fontSize: '13px', color: colors.text.secondary, margin: '2px 0 0' }}>Parrainage, credits et offres exclusives</p>
            </div>
          </div>
        </div>

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: '16px' }}
        >
          <CreditsWidget />
        </motion.div>

        {/* Referral card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ borderRadius: '16px', border: `1px solid var(--border-color)`, backgroundColor: colors.bg.secondary, overflow: 'hidden', marginBottom: '16px' }}
        >
          {/* Top band */}
          <div style={{ padding: '20px 22px 16px', borderBottom: `1px solid var(--border-color)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: `rgba(99,102,241,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Gift size={17} color={colors.violet.primary} />
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: 700, color: colors.text.primary, margin: 0 }}>Parrainez des createurs</p>
                <p style={{ fontSize: '12px', color: colors.text.secondary, margin: '2px 0 0' }}>Gagnez des credits en invitant vos amis</p>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: colors.text.secondary, lineHeight: '1.6', margin: 0 }}>
              Partagez votre lien unique. Chaque filleul qui postule pour la premiere fois vous offre <strong style={{ color: colors.text.primary }}>1 credit</strong> a chacun.
            </p>
          </div>

          {/* Link */}
          <div style={{ padding: '16px 22px' }}>
            {loading ? (
              <div style={{ height: '40px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)` }} />
            ) : code ? (
              <>
                <p style={{ fontSize: '11px', fontWeight: 600, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Votre lien de parrainage</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)`, borderRadius: '10px', padding: '10px 12px', marginBottom: '16px' }}>
                  <span style={{ flex: 1, fontSize: '12px', fontFamily: 'monospace', color: colors.text.secondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {referralUrl}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', backgroundColor: copied ? `rgba(22,163,74,0.12)` : colors.violet.primary, color: copied ? colors.green.textGreen : '#fff', fontSize: '12px', fontWeight: 600, transition: 'all 150ms' }}
                  >
                    {copied ? <><Check size={12} /> Copie</> : <><Copy size={12} /> Copier</>}
                  </button>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)`, textAlign: 'center' }}>
                    <p style={{ fontSize: '22px', fontWeight: 700, color: credited > 0 ? colors.green.textGreen : colors.text.primary, margin: '0 0 2px' }}>{credited}</p>
                    <p style={{ fontSize: '11px', color: colors.text.secondary, margin: 0 }}>credit{credited > 1 ? 's' : ''} gagnes</p>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)`, textAlign: 'center' }}>
                    <p style={{ fontSize: '22px', fontWeight: 700, color: pending > 0 ? colors.violet.primary : colors.text.primary, margin: '0 0 2px' }}>{pending}</p>
                    <p style={{ fontSize: '11px', color: colors.text.secondary, margin: 0 }}>en attente</p>
                  </div>
                </div>

                {credited === 0 && pending === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: `1px solid var(--border-color)` }}>
                    <Users size={14} color={colors.text.secondary} />
                    <p style={{ fontSize: '12px', color: colors.text.secondary, margin: 0 }}>Aucun filleul pour l'instant — partagez votre lien !</p>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: '13px', color: colors.text.secondary, margin: 0 }}>Impossible de charger votre code de parrainage.</p>
            )}
          </div>
        </motion.div>

        {/* Comment ca marche */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          style={{ borderRadius: '16px', border: `1px solid var(--border-color)`, backgroundColor: colors.bg.secondary, padding: '20px 22px' }}
        >
          <p style={{ fontSize: '13px', fontWeight: 700, color: colors.text.primary, margin: '0 0 14px' }}>Comment ca marche ?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: <Gift size={14} color={colors.violet.primary} />, text: 'Copiez votre lien et partagez-le a vos amis createurs' },
              { icon: <Users size={14} color={colors.violet.primary} />, text: 'Ils s\'inscrivent sur Nexart via votre lien' },
              { icon: <Zap size={14} color={colors.violet.primary} />, text: 'Des leur premiere candidature, vous recevez chacun 1 credit automatiquement' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: `rgba(99,102,241,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {step.icon}
                </div>
                <p style={{ fontSize: '13px', color: colors.text.secondary, margin: 0, lineHeight: '1.5', paddingTop: '5px' }}>{step.text}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  )
}
