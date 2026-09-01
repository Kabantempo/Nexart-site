'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, LayoutDashboard, CalendarCheck } from 'lucide-react'
import { colors } from '@/lib/design-tokens'
import Link from 'next/link'

type PaymentType = 'stand' | 'subscription' | 'credits' | 'unknown'

interface PageState {
  type: PaymentType
  eventId: string | null
  tier: string | null
}

const TIER_LABELS: Record<string, string> = {
  boost: 'Boost',
  pro: 'Pro',
  premium: 'Premium',
  org_pro: 'Organisateur Pro',
  org_studio: 'Organisateur Studio',
}

export default function StripeSuccessClient() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [state, setState] = useState<PageState>({ type: 'unknown', eventId: null, tier: null })
  const [countdown, setCountdown] = useState(8)

  useEffect(() => {
    const type = ((searchParams?.get('type') ?? 'unknown')) as PaymentType
    const eventId = searchParams?.get('event_id') ?? null
    const tier = searchParams?.get('tier') ?? null
    setState({ type, eventId, tier })
  }, [searchParams])

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      if (state.type === 'stand' && state.eventId) {
        router.push(`/events/${state.eventId}`)
      } else {
        router.push('/dashboard')
      }
      return
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, state, router])

  const config = getConfig(state)

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '56px 40px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: colors.green.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <CheckCircle size={36} color={colors.green.primary} strokeWidth={2} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px' }}
        >
          {config.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 28px' }}
        >
          {config.subtitle}
        </motion.p>

        {/* Detail box */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          style={{
            padding: '14px 18px',
            backgroundColor: colors.green.bg,
            border: `1px solid ${colors.green.pale}`,
            borderRadius: '12px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <config.Icon size={16} color={colors.green.primary} style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: colors.green.primary, fontWeight: 500, margin: 0, textAlign: 'left' }}>
            {config.detail}
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
        >
          <Link
            href={config.cta.href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: colors.violet.primary,
              color: colors.bg.primary,
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}
          >
            {config.cta.label}
            <ArrowRight size={14} />
          </Link>
        </motion.div>

        {/* Countdown */}
        <p style={{ fontSize: '11px', color: colors.text.muted, marginTop: '20px' }}>
          Redirection automatique dans {countdown}s…
        </p>
      </motion.div>
    </div>
  )
}

function getConfig(state: PageState): {
  title: string
  subtitle: string
  detail: string
  Icon: React.ComponentType<{ size?: number; color?: string; style?: React.CSSProperties }>
  cta: { label: string; href: string }
} {
  switch (state.type) {
    case 'stand':
      return {
        title: 'Stand réservé !',
        subtitle: 'Votre paiement a bien été enregistré. Vous recevrez une confirmation par email avec tous les détails de votre stand.',
        detail: 'Votre place est confirmée pour cet événement.',
        Icon: CalendarCheck,
        cta: {
          label: state.eventId ? 'Retour à l\'événement' : 'Mon dashboard',
          href: state.eventId ? `/events/${state.eventId}` : '/dashboard',
        },
      }
    case 'subscription':
      return {
        title: 'Abonnement activé !',
        subtitle: `Bienvenue dans votre plan${state.tier ? ' ' + (TIER_LABELS[state.tier] ?? state.tier) : ''} ! Vos nouvelles fonctionnalités sont immédiatement disponibles.`,
        detail: 'Votre compte a été mis à jour avec toutes les fonctionnalités de votre plan.',
        Icon: LayoutDashboard,
        cta: { label: 'Accéder à mon dashboard', href: '/dashboard' },
      }
    case 'credits':
      return {
        title: 'Crédits ajoutés !',
        subtitle: 'Vos crédits ont bien été ajoutés à votre compte et sont disponibles immédiatement.',
        detail: 'Utilisez vos crédits pour booster vos candidatures.',
        Icon: CheckCircle,
        cta: { label: 'Voir mes candidatures', href: '/dashboard' },
      }
    default:
      return {
        title: 'Paiement confirmé !',
        subtitle: 'Votre paiement a bien été pris en compte. Merci pour votre confiance.',
        detail: 'Une confirmation vous a été envoyée par email.',
        Icon: CheckCircle,
        cta: { label: 'Accéder à mon dashboard', href: '/dashboard' },
      }
  }
}
