'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Palette, Calendar, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const roles = [
  {
    value: 'creator',
    label: 'Créateur',
    description: 'Artiste, designer, artisan indépendant',
    icon: Palette,
    color: colors.violet.primary,
    bg: colors.violet.bg,
  },
  {
    value: 'organizer',
    label: 'Organisateur',
    description: 'Gérez vos marchés et événements',
    icon: Calendar,
    color: colors.purple.primary,
    bg: colors.purple.bgF5,
  },
  {
    value: 'visitor',
    label: 'Visiteur',
    description: 'Explorez et découvrez',
    icon: Eye,
    color: colors.green.primary,
    bg: colors.feedback.success.bg,
  },
]

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) { setError('Veuillez choisir un rôle.'); return }
    if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (err) {
      const supabaseErrors: Record<string, string> = {
        'User already registered': 'Un compte existe déjà avec cet email. <a href="/login">Se connecter</a>',
        'Password should be at least 6 characters': 'Le mot de passe doit contenir au moins 6 caractères.',
        'Unable to validate email address: invalid format': 'Adresse email invalide.',
        'signup_disabled': 'Les inscriptions sont temporairement désactivées.',
        'email_address_not_authorized': 'Cette adresse email n\'est pas autorisée.',
        'Too many requests': 'Trop de tentatives. Veuillez patienter quelques minutes.',
      }
      setError(supabaseErrors[err.message] ?? 'Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: name, role: role as any })
      // Email de bienvenue (fire-and-forget)
      fetch('/api/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, role }),
      }).catch(() => {})
      setSuccess(true)
    }
    setLoading(false)
  }

  const handleGoogle = async () => {
    setError(null)
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (err) setError(err.message)
  }

  const handleResend = async () => {
    setResending(true)
    setResendMsg(null)
    const { error: err } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } })
    if (err) setResendMsg('Erreur : ' + err.message)
    else setResendMsg('Email renvoyé !')
    setResending(false)
  }

  if (success) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.purple.bgF8fa} 0%, ${colors.purple.bgEef} 100%)`,
        padding: '32px 16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%', maxWidth: '440px',
            backgroundColor: 'var(--bg-primary)', borderRadius: '20px',
            border: `1px solid ${colors.gray.g300alt}`, padding: '48px 40px',
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: `linear-gradient(135deg, ${colors.purple.bgEef}, ${colors.purple.bgE0})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: '28px',
          }}>✉️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.3px' }}>
            Vérifiez vos emails
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '32px' }}>
            Un lien de confirmation a été envoyé à{' '}
            <strong style={{ color: `${colors.dark.slateDark}` }}>{email}</strong>.
            Cliquez dessus pour activer votre compte.
          </p>
          <Link
            href="/login"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '13px 28px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${colors.violet.primary}, ${colors.purple.indigo})`,
              color: colors.bg.primary, textDecoration: 'none',
              fontSize: '15px', fontWeight: '700',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
            }}
          >
            Aller à la connexion <ArrowRight size={16} />
          </Link>
          <div style={{ marginTop: '20px' }}>
            {resendMsg ? (
              <p style={{ fontSize: '13px', color: resendMsg.startsWith('Erreur') ? colors.red.textDark : colors.feedback.success.solid, margin: 0 }}>{resendMsg}</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                style={{
                  background: 'none', border: 'none', color: colors.violet.primary,
                  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                  opacity: resending ? 0.6 : 1, textDecoration: 'underline',
                }}
              >
                {resending ? 'Envoi…' : 'Renvoyer le mail de confirmation'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Panel gauche — branding */}
      <div style={{
        display: 'none',
        flex: '0 0 480px',
        background: `linear-gradient(135deg, ${colors.dark.alt} 0%, ${colors.purple.deepDark} 40%, ${colors.purple.bgDeep} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
      }}
        className="lg:flex"
      >
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Image src="/icon.png" alt="Nexart" width={36} height={36} />
              <span style={{ fontSize: '22px', fontWeight: '800', color: colors.bg.primary, letterSpacing: '-0.5px' }}>Nexart</span>
            </div>
          </Link>
        </div>

        {/* Contenu central */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 style={{ fontSize: '34px', fontWeight: '800', color: colors.bg.primary, lineHeight: '1.2', marginBottom: '16px', letterSpacing: '-0.5px' }}>
              Rejoignez la communauté Nexart
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '40px' }}>
              3 profils différents, une seule plateforme. Choisissez votre rôle et commencez votre aventure.
            </p>

            {/* Role previews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {roles.map((r, i) => {
                const Icon = r.icon
                return (
                  <motion.div
                    key={r.value}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 16px', borderRadius: '12px',
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      backgroundColor: 'rgba(99,102,241,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={18} color={colors.purple.bgPale} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: colors.bg.primary }}>{r.label}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{r.description}</div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Stats footer */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '32px' }}>
          {[['500+', 'Créateurs'], ['200+', 'Événements'], ['Gratuit', 'Pour commencer']].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: colors.bg.primary }}>{n}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' }}>{l}</div>
            </div>
          ))}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }} className="lg:hidden">
          <Image src="/icon.png" alt="Nexart" width={32} height={32} />
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>Nexart</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: '100%', maxWidth: '440px' }}
        >
          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
              Créer un compte
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              Déjà inscrit ?{' '}
              <Link href="/login" style={{ color: colors.violet.primary, fontWeight: '600', textDecoration: 'none' }}>
                Se connecter
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
              border: `1.5px solid ${colors.gray.g300alt}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              marginBottom: '24px', transition: 'all 200ms ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.gray["300slate"]; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.gray["300alt"]; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

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
                backgroundColor: colors.red.bg, border: `1px solid ${colors.red.bgCa}`,
                color: colors.red.text, fontSize: '14px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span aria-hidden="true">⚠️</span> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Nom */}
            <div>
              <label htmlFor="register-name" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Nom complet
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color={focused === 'name' ? colors.violet.primary : 'var(--text-tertiary)'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 200ms' }} aria-hidden="true" />
                <input
                  id="register-name"
                  type="text"
                  placeholder="Votre prénom et nom"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  required
                  style={{
                    width: '100%', padding: '13px 16px 13px 42px',
                    borderRadius: '10px', fontSize: '15px', color: 'var(--text-primary)',
                    border: focused === 'name' ? `1.5px solid ${colors.border.accent}` : `1.5px solid ${colors.gray.g300alt}`,
                    backgroundColor: focused === 'name' ? colors.purple.bgFafb : 'var(--bg-secondary)',
                    outline: 'none', transition: 'all 200ms ease', fontFamily: 'inherit',
                    boxShadow: focused === 'name' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="register-email" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={focused === 'email' ? colors.violet.primary : 'var(--text-tertiary)'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 200ms' }} aria-hidden="true" />
                <input
                  id="register-email"
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
                    border: focused === 'email' ? `1.5px solid ${colors.border.accent}` : `1.5px solid ${colors.gray.g300alt}`,
                    backgroundColor: focused === 'email' ? colors.purple.bgFafb : 'var(--bg-secondary)',
                    outline: 'none', transition: 'all 200ms ease', fontFamily: 'inherit',
                    boxShadow: focused === 'email' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Rôle — Cards */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '10px' }}>
                Vous êtes ?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(120px, 100%), 1fr))', gap: '10px' }}>
                {roles.map((r) => {
                  const Icon = r.icon
                  const selected = role === r.value
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      style={{
                        padding: '14px 8px', borderRadius: '12px', cursor: 'pointer',
                        border: selected ? `2px solid ${r.color}` : `1.5px solid ${colors.gray.g300alt}`,
                        backgroundColor: selected ? r.bg : 'var(--bg-secondary)',
                        transition: 'all 200ms ease',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                        boxShadow: selected ? `0 0 0 3px ${r.color}22` : 'none',
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        backgroundColor: selected ? r.color : colors.gray["300alt"],
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 200ms ease',
                      }}>
                        <Icon size={18} color={selected ? colors.bg.primary : 'var(--text-tertiary)'} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: selected ? r.color : `var(--text-body, ${colors.gray.dark})` }}>
                        {r.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="register-password" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={focused === 'password' ? colors.violet.primary : 'var(--text-tertiary)'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 200ms' }} aria-hidden="true" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 caractères"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  minLength={6}
                  style={{
                    width: '100%', padding: '13px 42px 13px 42px',
                    borderRadius: '10px', fontSize: '15px', color: 'var(--text-primary)',
                    border: focused === 'password' ? `1.5px solid ${colors.border.accent}` : `1.5px solid ${colors.gray.g300alt}`,
                    backgroundColor: focused === 'password' ? colors.purple.bgFafb : 'var(--bg-secondary)',
                    outline: 'none', transition: 'all 200ms ease', fontFamily: 'inherit',
                    boxShadow: focused === 'password' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} color={colors.gray.soft} /> : <Eye size={16} color={colors.gray.soft} />}
                </button>
              </div>
              {/* Indicateur de force du mot de passe */}
              {password.length > 0 && (() => {
                const strength = password.length >= 12 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 'Fort'
                  : password.length >= 8 ? 'Moyen'
                  : 'Faible'
                const color = strength === 'Fort' ? colors.feedback.success.solid : strength === 'Moyen' ? colors.feedback.warning.solid : colors.feedback.danger.solid
                const width = strength === 'Fort' ? '100%' : strength === 'Moyen' ? '60%' : '30%'
                return (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ height: '4px', borderRadius: '4px', backgroundColor: colors.border.default, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width, backgroundColor: color, borderRadius: '4px', transition: 'width 300ms ease, background-color 300ms ease' }} />
                    </div>
                    <p style={{ fontSize: '12px', color, marginTop: '4px', fontWeight: 500 }}>
                      Mot de passe {strength.toLowerCase()} {strength === 'Faible' ? '— min. 6 caractères' : strength === 'Moyen' ? '— ajoutez des chiffres et majuscules' : '✓'}
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label htmlFor="register-confirm-password" style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Confirmer le mot de passe
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={focused === 'confirmPassword' ? colors.violet.primary : 'var(--text-tertiary)'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 200ms' }} aria-hidden="true" />
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Retapez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocused('confirmPassword')}
                  onBlur={() => setFocused(null)}
                  required
                  minLength={6}
                  style={{
                    width: '100%', padding: '13px 42px 13px 42px',
                    borderRadius: '10px', fontSize: '15px', color: 'var(--text-primary)',
                    border: confirmPassword && password !== confirmPassword
                      ? `1.5px solid ${colors.red.medium}`
                      : focused === 'confirmPassword' ? `1.5px solid ${colors.border.accent}` : `1.5px solid ${colors.gray.g300alt}`,
                    backgroundColor: focused === 'confirmPassword' ? colors.purple.bgFafb : 'var(--bg-secondary)',
                    outline: 'none', transition: 'all 200ms ease', fontFamily: 'inherit',
                    boxShadow: focused === 'confirmPassword' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(v => !v)}
                  tabIndex={-1}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  {showConfirmPassword ? <EyeOff size={16} color={colors.gray.soft} /> : <Eye size={16} color={colors.gray.soft} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p style={{ fontSize: '12px', color: colors.red.textDark, marginTop: '6px' }}>Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (confirmPassword !== '' && password !== confirmPassword)}
              style={{
                width: '100%', padding: '14px 16px', marginTop: '4px',
                borderRadius: '10px',
                background: loading ? colors.purple.bgPale : `linear-gradient(135deg, ${colors.violet.primary}, ${colors.purple.indigo})`,
                color: colors.bg.primary, fontSize: '15px', fontWeight: '700',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)' }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)' }}
            >
              {loading ? 'Création…' : (<>Créer mon compte <ArrowRight size={16} /></>)}
            </button>
          </form>

          <p style={{ marginTop: '24px', fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: '1.6' }}>
            En vous inscrivant, vous acceptez nos{' '}
            <Link href="/conditions" style={{ color: colors.violet.primary, textDecoration: 'none' }}>CGU</Link>
            {' '}et notre{' '}
            <Link href="/confidentialite" style={{ color: colors.violet.primary, textDecoration: 'none' }}>politique de confidentialité</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
