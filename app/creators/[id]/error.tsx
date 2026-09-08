'use client'

import Link from 'next/link'
import { colors } from '@/lib/design-tokens'

export default function CreatorError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: '14px', color: colors.text.secondary, marginBottom: '8px' }}>
        Ce profil créateur est temporairement indisponible.
      </p>
      <p style={{ fontSize: '13px', color: colors.text.secondary, marginBottom: '28px', maxWidth: '380px' }}>
        Une erreur est survenue lors du chargement. Vous pouvez réessayer ou revenir à la liste des créateurs.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{ padding: '10px 20px', borderRadius: '10px', border: `1.5px solid ${colors.border.default}`, backgroundColor: colors.bg.primary, color: colors.text.primary, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          Réessayer
        </button>
        <Link
          href="/creators"
          style={{ padding: '10px 20px', borderRadius: '10px', backgroundColor: colors.violet.primary, color: '#fff', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}
        >
          Voir les créateurs
        </Link>
      </div>
    </div>
  )
}
