'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'

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
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#1A1A1A',
      color: '#FFFFFF',
      padding: '20px 24px',
      zIndex: 9999,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      borderTop: '1px solid var(--border-color)',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', fontSize: '16px' }}>
          Consentement Cookies
        </p>
        <p style={{ margin: 0, fontSize: '14px', color: '#D1D5DB' }}>
          Nexart utilise cookies pour analytics et amélioration.
          <a
            href="/confidentialite"
            style={{
              color: '#6366F1',
              textDecoration: 'underline',
              marginLeft: '4px',
              cursor: 'pointer'
            }}
          >
            Politique de confidentialité
          </a>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
        <button
          onClick={handleReject}
          style={{
            padding: '10px 20px',
            backgroundColor: 'transparent',
            color: '#D1D5DB',
            border: '1px solid #4B5563',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#374151'
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
            backgroundColor: '#6366F1',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#4F46E5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#6366F1'
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
