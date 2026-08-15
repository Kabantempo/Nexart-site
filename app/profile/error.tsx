'use client'

import Link from 'next/link'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { colors } from '@/lib/design-tokens'

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertCircle size={24} color="#f87171" />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f0f0f0', margin: '0 0 8px' }}>Quelque chose s&apos;est mal passé</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', lineHeight: 1.5 }}>
          Une erreur inattendue s&apos;est produite sur le profil.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            <RefreshCw size={13} /> Réessayer
          </button>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
