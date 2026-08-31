'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/design-tokens'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill={colors.blue.medium}/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill={colors.green.primary}/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill={colors.yellow.primary}/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill={colors.red.vivid}/>
    </svg>
  )
}

const features = [
  'Accédez à votre tableau de bord créateur ou organisateur',
  'Gérez vos candidatures et événements en temps réel',
  'Messagerie directe avec vos partenaires',
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // 2FA contextuel
  const [verifyStep, setVerifyStep] = useState(false)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    } else if (json.requires_verification) {
      setPendingUserId(json.user_id)
      setVerifyStep(true)
      setLoading(false)
    } else {
      await supabase.auth.setSession(json.session)
      const next = searchParams?.get('next')
      router.push(next && next.startsWith('/') ? next : '/dashboard')
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifyLoading(true)
    setError(null)
    const res = await fetch('/api/auth/verify-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: pendingUserId, email, password, code: verifyCode }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Code invalide.')
      setVerifyLoading(false)
    } else {
      await supabase.auth.setSession(json.session)
      const next = searchParams?.get('next')
      router.push(next && next.startsWith('/') ? next : '/dashboard')
    }
  }

  const handleGoogle = async () => {
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (err) setError(err.message)
  }

  if (verifyStep) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.secondary, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ width: '100%', maxWidth: '420px', backgroundColor: colors.bg.primary, borderRadius: '16px', border: `1px solid ${colors.border.default}`, padding: '40px', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.text.primary, marginBottom: '8px' }}>Vérification requise</h2>
            <p style={{ fontSize: '15px', color: colors.text.secondary, lineHeight: '1.5' }}>
              Nous avons détecté une connexion depuis un nouvel appareil.<br/>
              Un code à 6 chiffres a été envoyé à <strong>{email}</strong>.
            </p>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: colors.red.bg, border: `1px solid ${colors.red.bgCa}`, color: colors.feedback.danger.solid, fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.text.primary, marginBottom: '8px' }}>
                Code de vérification
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                style={{ width: '100%', padding: '14px 16px', borderRadius: '10px', border: `1px solid ${colors.border.default}`, fontSize: '28px', fontWeight: '700', letterSpacing: '12px', textAlign: 'center', color: colors.text.primary, backgroundColor: colors.bg.primary, fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={verifyLoading || verifyCode.length !== 6}
              style={{ width: '100%', padding: '14px', borderRadius: '10px', backgroundColor: verifyLoading || verifyCode.length !== 6 ? colors.purple.ringAlt : colors.violet.primary, color: '#fff', fontSize: '16px', fontWeight: '600', border: 'none', cursor: verifyLoading || verifyCode.length !== 6 ? 'not-allowed' : 'pointer' }}
            >
              {verifyLoading ? 'Vérification...' : 'Confirmer'}
            </button>

            <button
              type="button"
              onClick={() => { setVerifyStep(false); setError(null); setVerifyCode('') }}
              style={{ background: 'none', border: 'none', color: colors.text.secondary, fontSize: '14px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              ← Retour à la connexion
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <style>{`.login-left-panel{display:none}@media(min-width:1024px){.login-left-panel{display:flex}}`}</style>

      {/* Panel gauche — branding */}
      <div className="login-left-panel" style={{
        flex: '0 0 480px',
        background: `linear-gradient(135deg, ${colors.dark.alt} 0%, ${colors.purple.deepDark} 40%, ${colors.purple.bgDeep} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
      }}
      >
        {/* Grid décoratif */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />

        {/* Orbe lumineux */}
        <div style={{
          position: 'absolute', top: '-80px', right: '-80px',
          width: 'min(360px, 80vw)', height: 'min(360px, 80vw)',
          background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: 'min(280px, 70vw)', height: 'min(280px, 70vw)',
          background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Image src="/logo-full.png" alt="Nexart" width={140} height={40} style={{ objectFit: 'contain' }} />
          </Link>
        </div>

        {/* Contenu central */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 style={{ fontSize: '36px', fontWeight: '800', color: colors.bg.primary, lineHeight: '1.2', marginBottom: '16px', letterSpacing: '-0.5px' }}>
              La plateforme des créateurs et organisateurs de marchés
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '40px' }}>
              Connectez-vous à votre espace et gérez vos activités en toute simplicité.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}
                >
                  <CheckCircle2 size={18} color={colors.violet.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5' }}>{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

      </div>

      {/* Panel droit — formulaire */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        backgroundColor: 'var(--bg-primary)',
        overflowY: 'auto',
      }}>
        {/* Mobile logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }} className="lg:hidden">
          <Image src="/icon.png" alt="Nexart" width={32} height={32} />
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Nexart</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <div style={{ marginBottom: '36px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Bon retour 👋
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              Pas encore de compte ?{' '}
              <Link href="/register" style={{ color: colors.violet.primary, fontWeight: '600', textDecoration: 'none' }}>
                S'inscrire gratuitement
              </Link>
            </p>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            style={{
              width: '100%', padding: '13px 16px', borderRadius: '10px',
              backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)',
              fontSize: '15px', fontWeight: '600',
              border: `1.5px solid ${colors.border.default}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              marginBottom: '24px', transition: 'all 200ms ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.border.strong; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border.default; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-secondary)' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: '500' }}>ou par email</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--bg-secondary)' }} />
          </div>

          {error && (
            <motion.div
              role="alert"
              aria-live="assertive"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 16px', borderRadius: '10px',
                backgroundColor: colors.feedback.danger.bg, border: `1px solid ${colors.feedback.danger.border}`,
                color: colors.feedback.danger.text, fontSize: '14px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span>⚠️</span> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={focused === 'email' ? colors.violet.primary : 'var(--text-tertiary)'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 200ms' }} aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="vous@exemple.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  required
                  style={{
                    width: '100%', padding: '13px 16px 13px 42px',
                    borderRadius: '10px', fontSize: '15px', color: 'var(--text-primary)',
                    border: focused === 'email' ? `1.5px solid ${colors.violet.primary}` : `1.5px solid ${colors.border.default}`,
                    backgroundColor: focused === 'email' ? colors.purple.bgFafb : 'var(--bg-secondary)',
                    outline: 'none', transition: 'all 200ms ease', fontFamily: 'inherit',
                    boxShadow: focused === 'email' ? `0 0 0 3px ${colors.violet.ring}` : 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label htmlFor="login-password" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Mot de passe
                </label>
                <Link href="/forgot-password" style={{ fontSize: '13px', color: colors.violet.primary, fontWeight: '500', textDecoration: 'none' }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={focused === 'password' ? colors.violet.primary : 'var(--text-tertiary)'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 200ms' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  style={{
                    width: '100%', padding: '13px 42px 13px 42px',
                    borderRadius: '10px', fontSize: '15px', color: 'var(--text-primary)',
                    border: focused === 'password' ? `1.5px solid ${colors.violet.primary}` : `1.5px solid ${colors.border.default}`,
                    backgroundColor: focused === 'password' ? colors.purple.bgFafb : 'var(--bg-secondary)',
                    outline: 'none', transition: 'all 200ms ease', fontFamily: 'inherit',
                    boxShadow: focused === 'password' ? `0 0 0 3px ${colors.violet.ring}` : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px 16px', marginTop: '4px',
                borderRadius: '10px',
                background: loading ? colors.violet.hover : `linear-gradient(135deg, ${colors.violet.primary}, ${colors.violet.dark})`,
                color: colors.text.onViolet, fontSize: '15px', fontWeight: '700',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : `0 4px 14px ${colors.violet.ring}`,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = `0 6px 20px ${colors.violet.ring}` }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = `0 4px 14px ${colors.violet.ring}` }}
            >
              {loading ? 'Connexion…' : (<>Se connecter <ArrowRight size={16} /></>)}
            </button>
          </form>

          <p style={{ marginTop: '32px', fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: '1.6' }}>
            En vous connectant, vous acceptez nos{' '}
            <Link href="/legal/terms" style={{ color: colors.violet.primary, textDecoration: 'none' }}>CGU</Link>
            {' '}et notre{' '}
            <Link href="/legal/privacy" style={{ color: colors.violet.primary, textDecoration: 'none' }}>politique de confidentialité</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
