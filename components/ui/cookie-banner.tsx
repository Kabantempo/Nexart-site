'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'nexart_cookie_consent'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  const accept = () => { localStorage.setItem(STORAGE_KEY, 'accepted'); setVisible(false) }
  const decline = () => { localStorage.setItem(STORAGE_KEY, 'declined'); setVisible(false) }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Politique de cookies"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#1A1A1A',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        justifyContent: 'space-between',
      }}
    >
      <p style={{ color: '#D1D5DB', fontSize: '14px', lineHeight: '1.5', margin: 0, flex: '1 1 300px', maxWidth: 640 }}>
        Nexart utilise des cookies essentiels pour le fonctionnement du site et des cookies analytiques (GTM) pour améliorer votre expérience.{' '}
        <Link href="/legal/privacy" style={{ color: '#818CF8', textDecoration: 'underline' }}>
          En savoir plus
        </Link>
      </p>
      <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            padding: '9px 20px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)',
            backgroundColor: 'transparent',
            color: '#9CA3AF',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          Refuser
        </button>
        <button
          onClick={accept}
          style={{
            padding: '9px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#6366F1',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Accepter
        </button>
      </div>
    </div>
  )
}
