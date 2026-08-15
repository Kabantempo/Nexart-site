'use client'
import { useEffect, useState } from 'react'
import { colors } from '@/lib/design-tokens'

type ConnectStatus = 'none' | 'pending' | 'active' | 'restricted' | 'loading'

export default function StripeConnectBanner({ token }: { token: string }) {
  const [status, setStatus] = useState<ConnectStatus>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/stripe/connect/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setStatus(d.status ?? 'none'))
      .catch(() => setStatus('none'))
  }, [token])

  const startOnboarding = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading') return null
  if (status === 'active') {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${colors.green.textGreen} 0%, ${colors.green.textMid} 100%)`,
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        color: colors.bg.primary,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
      }}>
        <span style={{ fontSize: '20px' }}>✅</span>
        <div>
          <div style={{ fontWeight: 600, marginBottom: '2px' }}>Paiements directs activés</div>
          <div style={{ opacity: 0.85 }}>Les revenus des stands vous sont versés directement via Stripe Connect.</div>
        </div>
      </div>
    )
  }

  const isPending = status === 'pending' || status === 'restricted'

  return (
    <div style={{
      background: isPending
        ? `linear-gradient(135deg, ${colors.yellow.text} 0%, ${colors.yellow.textB45} 100%)`
        : `linear-gradient(135deg, ${colors.violet.primary} 0%, ${colors.purple.indigo} 100%)`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '20px',
      color: colors.bg.primary,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '20px' }}>{isPending ? '⏳' : '💸'}</span>
        <div style={{ fontSize: '14px' }}>
          <div style={{ fontWeight: 600, marginBottom: '2px' }}>
            {isPending ? 'Vérification en cours' : 'Activez les paiements directs'}
          </div>
          <div style={{ opacity: 0.85 }}>
            {isPending
              ? 'Complétez votre dossier Stripe pour recevoir les paiements de stands.'
              : 'Recevez directement les paiements de stands sur votre compte bancaire (Nexart retient 8%).'}
          </div>
        </div>
      </div>
      <button
        onClick={startOnboarding}
        disabled={busy}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: '8px',
          color: colors.bg.primary,
          padding: '8px 16px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: busy ? 'wait' : 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {busy ? '…' : isPending ? 'Continuer →' : 'Connecter →'}
      </button>
    </div>
  )
}

export function StripeConnectAlert({ searchParams }: { searchParams: URLSearchParams }) {
  const value = searchParams.get('stripe_connect')

  const configs: Record<string, { color: string; bg: string; message: string }> = {
    active: { bg: colors.green.bgLight, color: colors.green.textMid, message: '✅ Stripe Connect activé ! Vous recevrez désormais les paiements de stands directement.' },
    restricted: { bg: colors.yellow.bg, color: colors.feedback.warning.text, message: '⚠️ Compte Stripe en cours de vérification. Complétez votre dossier pour activer les paiements.' },
    pending: { bg: colors.yellow.bg, color: colors.feedback.warning.text, message: '⏳ Onboarding en cours. Revenez une fois votre compte Stripe validé.' },
    refresh: { bg: colors.yellow.bg, color: colors.feedback.warning.text, message: '🔄 Session Stripe expirée. Relancez le processus d\'onboarding.' },
    error: { bg: colors.red.bgSoft, color: colors.feedback.danger.solid, message: '❌ Une erreur est survenue avec Stripe Connect. Réessayez.' },
  }

  const cfg = value ? configs[value] : null
  if (!cfg) return null

  return (
    <div style={{
      background: cfg.bg,
      color: cfg.color,
      borderRadius: '10px',
      padding: '12px 16px',
      marginBottom: '16px',
      fontSize: '14px',
      fontWeight: 500,
    }}>
      {cfg.message}
    </div>
  )
}
