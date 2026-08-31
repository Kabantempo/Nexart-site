'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Zap, Star } from 'lucide-react'
import Link from 'next/link'
import { colors } from '@/lib/design-tokens'

const PLAN_LABELS: Record<string, string> = {
  boost: 'Boost',
  pro: 'Pro',
  premium: 'Premium',
  org_pro: 'Organisateur Pro',
  org_studio: 'Studio',
}

const CREDIT_LABELS: Record<string, string> = {
  '10': '10 crédits',
  '30': '30 crédits',
  '60': '60 crédits',
}

export default function StripeSuccessClient() {
  const params = useSearchParams()
  const router = useRouter()
  const type = params.get('type') ?? 'subscription'
  const plan = params.get('plan') ?? ''
  const credits = params.get('credits') ?? ''

  const [dots, setDots] = useState('')
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 400)
    return () => clearInterval(t)
  }, [])

  const isCredits = type === 'credits'
  const label = isCredits
    ? (CREDIT_LABELS[credits] ?? 'des crédits')
    : (PLAN_LABELS[plan] ?? 'votre abonnement')

  return (
    <div style={{ minHeight: 'calc(100vh - 80px)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)', padding: '24px 16px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}
      >
        {/* Icône succès animée */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 200 }}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '88px', height: '88px', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.1)', marginBottom: '28px' }}
        >
          <CheckCircle size={44} color={colors.violet.primary} strokeWidth={2} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.2 }}>
            Paiement confirmé !
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
            {isCredits
              ? `Vous venez d'acquérir ${label}. Ils sont déjà disponibles sur votre compte.`
              : `Vous bénéficiez maintenant du plan ${label}. Toutes les fonctionnalités sont déjà actives.`
            }
          </p>

          {/* Card récap */}
          <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '16px', padding: '20px 24px', marginBottom: '28px', border: '1px solid var(--border-color)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${colors.violet.primary}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isCredits ? <Zap size={18} color={colors.violet.primary} /> : <Star size={18} color={colors.violet.primary} />}
              </div>
              <div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 2px' }}>
                  {isCredits ? 'Crédits achetés' : 'Plan activé'}
                </p>
                <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {label}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link
              href="/dashboard"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px 24px', borderRadius: '10px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '15px', fontWeight: 700, textDecoration: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = colors.violet.dark}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = colors.violet.primary}
            >
              Aller au dashboard
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/creators"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px 24px', borderRadius: '10px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, textDecoration: 'none', transition: 'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = colors.violet.primary}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'}
            >
              Explorer les créateurs
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
