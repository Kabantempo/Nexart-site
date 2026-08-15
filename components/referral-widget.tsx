'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'
import { Copy, Check, Gift, Users } from 'lucide-react'

export function ReferralWidget() {
  const [code, setCode] = useState<string | null>(null)
  const [credited, setCredited] = useState(0)
  const [pending, setPending] = useState(0)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
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
  }, [])

  const referralUrl = code ? `${typeof window !== 'undefined' ? window.location.origin : 'https://nexart.fr'}/?ref=${code}` : ''

  const handleCopy = () => {
    if (!referralUrl) return
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !code) return null

  return (
    <div style={{
      backgroundColor: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: '14px',
      padding: '16px',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Gift size={16} color={colors.violet.primary} />
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Parrainez des créateurs</span>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.5' }}>
        Partagez votre lien. Chaque filleul qui postule pour la première fois vous offre <strong>1 crédit</strong> à chacun.
      </p>

      {/* Referral link */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px', padding: '8px 10px',
        marginBottom: '10px',
      }}>
        <span style={{ flex: 1, fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {referralUrl}
        </span>
        <button
          onClick={handleCopy}
          style={{
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            backgroundColor: copied ? '#DCFCE7' : colors.violet.primary,
            color: copied ? '#15803D' : '#FFFFFF',
            fontSize: '11px', fontWeight: '600', transition: 'all 150ms ease',
          }}
        >
          {copied ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
        </button>
      </div>

      {/* Stats */}
      {(credited > 0 || pending > 0) && (
        <div style={{ display: 'flex', gap: '8px' }}>
          {credited > 0 && (
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '8px', backgroundColor: '#DCFCE7' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#15803D' }}>{credited}</div>
              <div style={{ fontSize: '10px', color: '#15803D' }}>crédité{credited > 1 ? 's' : ''}</div>
            </div>
          )}
          {pending > 0 && (
            <div style={{ flex: 1, textAlign: 'center', padding: '8px', borderRadius: '8px', backgroundColor: '#EEF2FF' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: colors.violet.primary }}>{pending}</div>
              <div style={{ fontSize: '10px', color: colors.violet.primary }}>en attente</div>
            </div>
          )}
        </div>
      )}

      {credited === 0 && pending === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <Users size={12} />
          Aucun filleul pour l&apos;instant — partagez votre lien !
        </div>
      )}
    </div>
  )
}
