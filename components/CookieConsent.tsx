'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { colors } from '@/lib/design-tokens'

export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = Cookies.get('nexart-cookie-consent')
    if (!consent) setShow(true)
  }, [])

  const handleAccept = () => {
    Cookies.set('nexart-cookie-consent', 'all', { expires: 365 })
    setShow(false)
    loadAnalytics()
  }

  const handleReject = () => {
    Cookies.set('nexart-cookie-consent', 'none', { expires: 365 })
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="cookie-consent-bar" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.text.primary,
      color: colors.bg.primary,
      padding: '20px 24px',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      borderTop: '1px solid var(--border-color)',
      boxSizing: 'border-box',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '16px' }}>
          Consentement Cookies
        </p>
        <p style={{ margin: 0, fontSize: '14px', color: colors.gray["300"] }}>
          Nexart utilise cookies pour analytics et amélioration.
          <a
            href="/confidentialite"
            style={{
              color: colors.violet.primary,
              textDecoration: 'underline',
              marginLeft: '4px',
              cursor: 'pointer'
            }}
          >
            Politique de confidentialité
          </a>
        </p>
      </div>

      <div className="cookie-consent-actions" style={{ display: 'flex', gap: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
        <button
          onClick={handleReject}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: colors.gray["300"],
            border: `1px solid ${colors.gray.g600}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.gray["700"]
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          Refuser
        </button>
        <button
          onClick={handleAccept}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.violet.primary,
            color: colors.bg.primary,
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.purple.indigo
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.violet.primary
          }}
        >
          Accepter Tous
        </button>
      </div>
    </div>
  )
}

function loadAnalytics() {
  // Google Tag Manager (GTM-PC469WF9)
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=GTM-PC469WF9'
  document.head.appendChild(script)

  // Initialize gtag
  ;(window as any).dataLayer = (window as any).dataLayer || []
  function gtag(...args: any[]) {
    ;(window as any).dataLayer.push(args)
  }
  gtag('js', new Date())
  gtag('config', 'GTM-PC469WF9', {
    anonymize_ip: true
  })
}
