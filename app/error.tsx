'use client'

import { colors, alpha } from '@/lib/design-tokens'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', backgroundColor: 'var(--bg-primary)' }}>
      <div style={{ pointerEvents: 'none', position: 'fixed', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-128px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: alpha(colors.feedback.danger.solid, 0.05), filter: 'blur(140px)' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '120px', fontWeight: 900, lineHeight: 1, marginBottom: '16px', background: `linear-gradient(135deg, ${colors.feedback.danger.solid}, ${colors.red.softAlt})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          500
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Une erreur est survenue
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: 1.6 }}>
          Quelque chose s&apos;est mal passé de notre côté. Veuillez réessayer ou nous contacter si le problème persiste.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
          <button onClick={reset} style={{ padding: '12px 24px', borderRadius: '12px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '14px', fontWeight: 700, border: 'none', cursor: 'pointer' }}>
            ↺ Réessayer
          </button>
          <Link href="/" style={{ padding: '12px 24px', borderRadius: '12px', border: `1px solid var(--border-color)`, color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
            ← Retour à l&apos;accueil
          </Link>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Besoin d&apos;aide ?{' '}
          <Link href="/contact" style={{ color: colors.violet.primary, textDecoration: 'none' }}>Contactez-nous</Link>
        </p>
      </div>
    </div>
  )
}
