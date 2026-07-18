'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Settings2, X } from 'lucide-react'

const STORAGE_KEY = 'nexart_cookie_consent_v2'

interface CookiePrefs {
  essential: true
  analytics: boolean
  marketing: boolean
}

function loadPrefs(): CookiePrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function savePrefs(prefs: CookiePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

export function useCookieConsent() {
  const [prefs, setPrefs] = useState<CookiePrefs | null>(null)
  useEffect(() => { setPrefs(loadPrefs()) }, [])
  return prefs
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (!loadPrefs()) setVisible(true)
  }, [])

  const acceptAll = () => {
    savePrefs({ essential: true, analytics: true, marketing: true })
    setVisible(false)
  }

  const declineAll = () => {
    savePrefs({ essential: true, analytics: false, marketing: false })
    setVisible(false)
  }

  const saveCustom = () => {
    savePrefs({ essential: true, analytics, marketing })
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gestion des cookies"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#1A1A1A',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Main banner */}
      {!customizing ? (
        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
          <p style={{ color: '#D1D5DB', fontSize: '14px', lineHeight: '1.5', margin: 0, flex: '1 1 300px', maxWidth: 640 }}>
            Nexart utilise des cookies essentiels pour le fonctionnement du site et des cookies analytiques pour améliorer votre expérience.{' '}
            <Link href="/confidentialite" style={{ color: '#818CF8', textDecoration: 'underline' }}>
              En savoir plus
            </Link>
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>
            <button
              onClick={() => setCustomizing(true)}
              style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: '#9CA3AF', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Settings2 size={14} /> Personnaliser
            </button>
            <button
              onClick={declineAll}
              style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: '#D1D5DB', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              Refuser
            </button>
            <button
              onClick={acceptAll}
              style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Tout accepter
            </button>
          </div>
        </div>
      ) : (
        /* Customization panel */
        <div style={{ padding: '24px', maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: '#F9FAFB', fontSize: '16px', fontWeight: '700', margin: 0 }}>Personnaliser les cookies</h3>
            <button onClick={() => setCustomizing(false)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            {/* Essential */}
            <CookieCategory
              title="Essentiels"
              description="Nécessaires au fonctionnement du site (authentification, session). Ne peuvent pas être désactivés."
              enabled={true}
              locked
              onChange={() => {}}
            />
            {/* Analytics */}
            <CookieCategory
              title="Analytiques"
              description="Nous aident à comprendre comment vous utilisez le site (pages visitées, clics). Aucune donnée vendue à des tiers."
              enabled={analytics}
              onChange={setAnalytics}
            />
            {/* Marketing */}
            <CookieCategory
              title="Marketing"
              description="Permettent de vous proposer des contenus personnalisés et des publicités adaptées à vos centres d'intérêt."
              enabled={marketing}
              onChange={setMarketing}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={declineAll}
              style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: '#D1D5DB', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              Tout refuser
            </button>
            <button
              onClick={saveCustom}
              style={{ padding: '9px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
            >
              Enregistrer mes préférences
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CookieCategory({ title, description, enabled, locked, onChange }: {
  title: string; description: string; enabled: boolean; locked?: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', padding: '14px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#F9FAFB', fontSize: '14px', fontWeight: '600', margin: '0 0 4px' }}>{title}</p>
        <p style={{ color: '#9CA3AF', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>{description}</p>
      </div>
      <label style={{ flexShrink: 0, cursor: locked ? 'not-allowed' : 'pointer' }}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={locked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ display: 'none' }}
        />
        <span style={{
          display: 'block', width: '40px', height: '22px', borderRadius: '11px',
          backgroundColor: enabled ? '#6366F1' : 'rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background-color 200ms',
          opacity: locked ? 0.6 : 1,
        }}>
          <span style={{
            display: 'block', width: '16px', height: '16px', borderRadius: '50%',
            backgroundColor: '#fff', position: 'absolute', top: '3px',
            left: enabled ? '21px' : '3px', transition: 'left 200ms',
          }} />
        </span>
      </label>
    </div>
  )
}
