'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setShow(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setShow(false)
  }

  const rejectCookies = () => {
    localStorage.setItem('cookie-consent', 'rejected')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1A1A1A',
        borderTop: '1px solid #333333',
        padding: '24px 16px',
        zIndex: 1000,
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ flex: 1, minWidth: '250px' }}>
            <p style={{ fontSize: '14px', color: '#FFFFFF', margin: '0 0 8px 0', fontWeight: '600' }}>
              🍪 Nous utilisons des cookies
            </p>
            <p style={{ fontSize: '13px', color: '#AAAAAA', margin: 0, lineHeight: '1.5' }}>
              Nous utilisons Google Tag Manager pour analyser votre utilisation du site.{' '}
              <Link href="/legal/privacy" style={{ color: '#6366F1', textDecoration: 'none' }}>
                En savoir plus
              </Link>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={rejectCookies}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: '1px solid #444444',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 300ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.color = '#6366F1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#444444'
                e.currentTarget.style.color = '#FFFFFF'
              }}
            >
              Refuser
            </button>
            <button
              onClick={acceptCookies}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 300ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5B5BD6'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366F1'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
