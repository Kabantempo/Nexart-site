'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Download, Trash2, ChevronRight, Bell, BellOff, Moon, Sun, Globe, Eye, EyeOff, Lock, Mail, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/toast-provider'
import { useTheme } from '@/lib/use-theme'
import { colors } from '@/lib/design-tokens'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

type NotificationPrefs = { messages: boolean; applications: boolean; reminders: boolean; newsletter: boolean }
type UserSettings = {
  notification_prefs: NotificationPrefs
  profile_visibility: 'public' | 'private'
  preferred_language: 'fr' | 'en'
  travel_radius: number
  is_creator: boolean
}

export default function SettingsClient() {
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleExportData = async () => {
    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const response = await fetch('/api/account/export-data', {
        method: 'GET',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })

      if (!response.ok) throw new Error('Erreur export données')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nexart-data-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)

      toast.success('Données téléchargées')
    } catch (err: any) {
      toast.error(err.message || 'Erreur téléchargement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
      {/* Header */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 0' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Paramètres
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '40px' }}>
            Gestion compte, données et préférences
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        <div style={{ display: 'grid', gap: '60px' }}>
          {/* Section: Export Data */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Données Personnelles
            </h2>

            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Télécharger mes données
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Export profil, conversations, reviews (JSON)
                </p>
              </div>
              <button
                onClick={handleExportData}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: colors.violet.primary,
                  color: colors.bg.primary,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  fontSize: '14px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = '#4F46E5'
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = colors.violet.primary
                }}
              >
                <Download size={16} />
                {loading ? 'Export...' : 'Exporter'}
              </button>
            </div>
          </motion.section>

          {/* Section: Delete Account */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Suppression Compte
            </h2>

            <div style={{ backgroundColor: colors.red.bg, border: '1px solid #FECACA', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#991B1B', marginBottom: '12px' }}>
                    Supprimer définitivement
                  </h3>
                  <ul style={{ fontSize: '14px', color: '#7F1D1D', marginBottom: '12px', marginLeft: '20px' }}>
                    <li style={{ marginBottom: '6px' }}>Compte masqué immédiatement</li>
                    <li style={{ marginBottom: '6px' }}>24h pour annuler par email</li>
                    <li style={{ marginBottom: '6px' }}>Suppression après 30 jours</li>
                    <li>Contrats conservés 11 ans</li>
                  </ul>
                  <p style={{ fontSize: '12px', color: '#991B1B', fontStyle: 'italic' }}>
                    Cette action est irréversible après 30 jours.
                  </p>
                </div>
                <DeleteAccountButton />
              </div>
            </div>
          </motion.section>

          {/* Section: Apparence */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Apparence
            </h2>
            <ThemeSection />
          </motion.section>

          {/* Section: Notifications */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Notifications
            </h2>
            <PushNotificationSection />
          </motion.section>

          {/* Section: Sécurité */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Sécurité
            </h2>
            <SecuritySection />
          </motion.section>

          {/* Section: Préférences notifications */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Préférences notifications
            </h2>
            <NotificationPrefsSection />
          </motion.section>

          {/* Section: Confidentialité */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Confidentialité
            </h2>
            <PrivacySection />
          </motion.section>

          {/* Section: Langue */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              Langue
            </h2>
            <LanguageSection />
          </motion.section>

          {/* Section: RGPD */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            style={{ borderTop: '1px solid var(--border-color)', paddingTop: '60px', marginBottom: '40px' }}
          >
            <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>
              RGPD & Conformité
            </h2>

            <div style={{ display: 'grid', gap: '12px' }}>
              <a
                href="/confidentialite"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Politique de confidentialité
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Lire nos engagements RGPD</p>
                </div>
                <ChevronRight size={20} color="var(--text-secondary)" />
              </a>

              <a
                href="mailto:contact@nexart.fr?subject=RGPD%20Demande"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Demande RGPD
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Accès, rectification, portabilité (contact@nexart.fr)
                  </p>
                </div>
                <ChevronRight size={20} color="var(--text-secondary)" />
              </a>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  )
}

function ThemeSection() {
  const { theme, setMode } = useTheme()

  const options: { value: 'light' | 'dark' | 'system'; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Clair', desc: 'Interface toujours en mode clair', icon: <Sun size={18} /> },
    { value: 'dark', label: 'Sombre', desc: 'Interface toujours en mode sombre', icon: <Moon size={18} /> },
    { value: 'system', label: 'Système', desc: 'Suit les préférences de votre appareil', icon: <span style={{ fontSize: '18px', lineHeight: 1 }}>⚙️</span> },
  ]

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {options.map(opt => {
        const active = theme === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              backgroundColor: active ? (opt.value === 'dark' ? '#1F2937' : opt.value === 'light' ? colors.bg.secondary : 'var(--bg-secondary)') : 'var(--bg-primary)',
              border: active ? '2px solid #6366F1' : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              width: '100%',
            }}
          >
            <span style={{ color: active ? colors.violet.primary : 'var(--text-secondary)', flexShrink: 0 }}>{opt.icon}</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: active ? colors.violet.primary : 'var(--text-primary)', marginBottom: '2px' }}>{opt.label}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{opt.desc}</div>
            </div>
            {active && (
              <span style={{ marginLeft: 'auto', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.violet.primary, flexShrink: 0 }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

function PushNotificationSection() {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && VAPID_PUBLIC) {
      setSupported(true)
      navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription()).then(sub => setSubscribed(!!sub)).catch(() => {})
    }
  }, [])

  async function toggle() {
    if (!VAPID_PUBLIC) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/subscribe', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
          setSubscribed(false)
        }
      } else {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        })
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(sub.getKey('auth')!))),
            },
          }),
        })
        setSubscribed(true)
      }
    } catch (err) {
      console.error('Push toggle error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Notifications push
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {supported
            ? subscribed ? 'Activées — vous recevez les notifications en temps réel' : 'Désactivées — activez pour recevoir des alertes'
            : 'Non supporté par votre navigateur'}
        </p>
      </div>
      {supported && (
        <button
          onClick={toggle}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: subscribed ? colors.violet.primary : 'var(--border-color)',
            color: subscribed ? colors.bg.primary : 'var(--text-primary)',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {subscribed ? <Bell size={16} /> : <BellOff size={16} />}
          {loading ? '...' : subscribed ? 'Désactiver' : 'Activer'}
        </button>
      )}
    </div>
  )
}

async function getToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

async function patchSettings(payload: Record<string, unknown>) {
  const token = await getToken()
  const res = await fetch('/api/account/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Erreur sauvegarde')
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        backgroundColor: checked ? colors.violet.primary : 'var(--border-color)',
        position: 'relative', transition: 'background-color 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: checked ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%', backgroundColor: colors.bg.primary,
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  )
}

function SecuritySection() {
  const [emailMode, setEmailMode] = useState(false)
  const [passwordMode, setPasswordMode] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleEmailChange = async () => {
    if (!newEmail) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw error
      toast.success('Email mis à jour — vérifiez votre boîte mail')
      setEmailMode(false)
      setNewEmail('')
    } catch (err: any) {
      toast.error(err.message || 'Erreur mise à jour email')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Mot de passe trop court (8 caractères min)')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Mot de passe mis à jour')
      setPasswordMode(false)
      setNewPassword('')
    } catch (err: any) {
      toast.error(err.message || 'Erreur mise à jour mot de passe')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px',
    fontSize: '14px', color: 'var(--text-primary)', backgroundColor: 'var(--bg-primary)',
    flex: 1, outline: 'none',
  }

  const btnStyle = (danger = false): React.CSSProperties => ({
    padding: '10px 16px', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '14px', fontWeight: 600, opacity: loading ? 0.6 : 1,
    backgroundColor: danger ? colors.violet.primary : 'var(--border-color)',
    color: danger ? colors.bg.primary : 'var(--text-primary)',
  })

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {/* Email */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Mail size={18} color="var(--text-secondary)" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Adresse email</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Modifier votre email de connexion</div>
            </div>
          </div>
          <button onClick={() => { setEmailMode(!emailMode); setPasswordMode(false) }} style={btnStyle()}>
            {emailMode ? 'Annuler' : 'Modifier'}
          </button>
        </div>
        {emailMode && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <input type="email" placeholder="nouveau@email.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} style={inputStyle} />
            <button onClick={handleEmailChange} disabled={loading || !newEmail} style={btnStyle(true)}>Sauvegarder</button>
          </div>
        )}
      </div>

      {/* Mot de passe */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Lock size={18} color="var(--text-secondary)" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Mot de passe</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Choisir un nouveau mot de passe</div>
            </div>
          </div>
          <button onClick={() => { setPasswordMode(!passwordMode); setEmailMode(false) }} style={btnStyle()}>
            {passwordMode ? 'Annuler' : 'Modifier'}
          </button>
        </div>
        {passwordMode && (
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <input type="password" placeholder="Nouveau mot de passe (8 car. min)" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
            <button onClick={handlePasswordChange} disabled={loading || newPassword.length < 8} style={btnStyle(true)}>Sauvegarder</button>
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationPrefsSection() {
  const [prefs, setPrefs] = useState({ messages: true, applications: true, reminders: true, newsletter: false })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      const token = await getToken()
      const res = await fetch('/api/account/settings', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (res.ok) {
        const data = await res.json()
        if (data.notification_prefs) setPrefs(data.notification_prefs)
      }
    }
    load()
  }, [])

  const toggle = async (key: keyof typeof prefs) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setSaving(true)
    try {
      await patchSettings({ notification_prefs: next })
      toast.success('Préférences sauvegardées')
    } catch {
      toast.error('Erreur sauvegarde')
      setPrefs(prefs)
    } finally {
      setSaving(false)
    }
  }

  const items: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: 'messages', label: 'Nouveaux messages', desc: 'Notification quand vous recevez un message' },
    { key: 'applications', label: 'Candidatures', desc: 'Acceptation, refus ou mise à jour de vos candidatures' },
    { key: 'reminders', label: 'Rappels événements', desc: 'Rappels J-7 et J-1 avant un marché' },
    { key: 'newsletter', label: 'Newsletter Nexart', desc: 'Actualités, conseils et nouveautés de la plateforme' },
  ]

  return (
    <div style={{ display: 'grid', gap: '12px', opacity: saving ? 0.7 : 1, transition: 'opacity 0.2s' }}>
      {items.map(item => (
        <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px 20px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{item.label}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.desc}</div>
          </div>
          <Toggle checked={prefs[item.key]} onChange={() => toggle(item.key)} />
        </div>
      ))}
    </div>
  )
}

function PrivacySection() {
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [radius, setRadius] = useState(50)
  const [isCreator, setIsCreator] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      const token = await getToken()
      const res = await fetch('/api/account/settings', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (res.ok) {
        const data = await res.json()
        setVisibility(data.profile_visibility ?? 'public')
        setRadius(data.travel_radius ?? 50)
        setIsCreator(data.is_creator ?? false)
      }
    }
    load()
  }, [])

  const saveVisibility = async (val: 'public' | 'private') => {
    setVisibility(val)
    setSaving(true)
    try {
      await patchSettings({ profile_visibility: val })
      toast.success('Visibilité mise à jour')
    } catch {
      toast.error('Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const saveRadius = async () => {
    setSaving(true)
    try {
      await patchSettings({ travel_radius: radius })
      toast.success('Rayon mis à jour')
    } catch {
      toast.error('Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {/* Visibilité profil */}
      <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          {visibility === 'public' ? <Eye size={18} color="var(--text-secondary)" /> : <EyeOff size={18} color="var(--text-secondary)" />}
          <div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Visibilité du profil</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contrôlez qui peut voir votre profil</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {(['public', 'private'] as const).map(val => (
            <button
              key={val}
              onClick={() => saveVisibility(val)}
              disabled={saving}
              style={{
                padding: '12px', border: visibility === val ? '2px solid #6366F1' : '1px solid var(--border-color)',
                borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                backgroundColor: visibility === val ? colors.violet.bg : 'var(--bg-primary)',
                color: visibility === val ? colors.violet.primary : 'var(--text-primary)',
              }}
            >
              {val === 'public' ? 'Public' : 'Privé'}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '10px' }}>
          {visibility === 'private' ? 'Votre profil est masqué des résultats de recherche.' : 'Votre profil est visible par tous les visiteurs.'}
        </p>
      </div>

      {/* Rayon de recherche (créateurs uniquement) */}
      {isCreator && (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <MapPin size={18} color="var(--text-secondary)" />
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Rayon de déplacement</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Distance maximale pour les marchés proposés</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <input
              type="range" min={10} max={500} step={10} value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              style={{ flex: 1, accentColor: colors.violet.primary }}
            />
            <span style={{ fontSize: '16px', fontWeight: 700, color: colors.violet.primary, minWidth: '60px', textAlign: 'right' }}>
              {radius} km
            </span>
          </div>
          <button
            onClick={saveRadius} disabled={saving}
            style={{ marginTop: '12px', padding: '10px 20px', backgroundColor: colors.violet.primary, color: colors.bg.primary, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}
          >
            Sauvegarder
          </button>
        </div>
      )}
    </div>
  )
}

function LanguageSection() {
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  useEffect(() => {
    const load = async () => {
      const token = await getToken()
      const res = await fetch('/api/account/settings', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      if (res.ok) {
        const data = await res.json()
        setLang(data.preferred_language ?? 'fr')
      }
    }
    load()
  }, [])

  const select = async (val: 'fr' | 'en') => {
    setLang(val)
    setSaving(true)
    try {
      await patchSettings({ preferred_language: val })
      toast.success('Langue mise à jour')
    } catch {
      toast.error('Erreur sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const options = [
    { value: 'fr' as const, label: 'Français', flag: '🇫🇷' },
    { value: 'en' as const, label: 'English', flag: '🇬🇧' },
  ]

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
        <Globe size={18} color="var(--text-secondary)" />
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Langue de l&apos;interface (traduction complète à venir)
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '16px 20px', border: lang === opt.value ? '2px solid #6366F1' : '1px solid var(--border-color)',
              borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
              backgroundColor: lang === opt.value ? colors.violet.bg : 'var(--bg-primary)',
            }}
          >
            <span style={{ fontSize: '24px' }}>{opt.flag}</span>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: lang === opt.value ? colors.violet.primary : 'var(--text-primary)' }}>
                {opt.label}
              </div>
            </div>
            {lang === opt.value && (
              <span style={{ marginLeft: 'auto', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: colors.violet.primary }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function DeleteAccountButton() {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'confirm' | 'email'>('confirm')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const handleDelete = async () => {
    if (!email) {
      toast.error('Email requis')
      return
    }

    setLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const meResponse = await fetch('/api/auth/me', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const { id: userId } = await meResponse.json()

      const response = await fetch('/api/account/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ userId, email }),
      })

      if (!response.ok) throw new Error('Erreur suppression')

      setShowModal(false)
      setStep('confirm')
      setEmail('')
    } catch (err: any) {
      toast.error(err.message || 'Erreur serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: colors.feedback.danger.solid,
          color: colors.bg.primary,
          border: 'none',
          borderRadius: '8px',
          padding: '10px 16px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 600,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#B91C1C'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.feedback.danger.solid
        }}
      >
        <Trash2 size={16} />
        Supprimer
      </button>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => !loading && setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
            }}
          >
            {step === 'confirm' ? (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: colors.feedback.danger.solid, marginBottom: '16px' }}>
                  ⚠️ Confirmer suppression
                </h2>
                <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
                  Vous avez 24h pour annuler via email après confirmation.
                </p>

                <div style={{ display: 'grid', gap: '12px' }}>
                  <button
                    onClick={() => setStep('email')}
                    style={{
                      backgroundColor: colors.feedback.danger.solid,
                      color: colors.bg.primary,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#B91C1C'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = colors.feedback.danger.solid
                    }}
                  >
                    Oui, supprimer
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      backgroundColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--text-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--border-color)'
                    }}
                  >
                    Annuler
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
                  Confirmer suppression
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                  Entrez votre email pour confirmer :
                </p>

                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    color: 'var(--text-primary)',
                  }}
                />

                <div style={{ display: 'grid', gap: '12px' }}>
                  <button
                    onClick={handleDelete}
                    disabled={loading || !email}
                    style={{
                      backgroundColor: colors.feedback.danger.solid,
                      color: colors.bg.primary,
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: loading || !email ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      opacity: loading || !email ? 0.6 : 1,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading && email) e.currentTarget.style.backgroundColor = '#B91C1C'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading && email) e.currentTarget.style.backgroundColor = colors.feedback.danger.solid
                    }}
                  >
                    {loading ? 'Suppression...' : 'Confirmer'}
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setStep('confirm')
                      setEmail('')
                    }}
                    style={{
                      backgroundColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '14px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--text-secondary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--border-color)'
                    }}
                  >
                    Retour
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </>
  )
}
