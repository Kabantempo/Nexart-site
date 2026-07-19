'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect.'
        : err.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* Panel gauche — branding */}
      <div style={{
        display: 'none',
        flex: '0 0 480px',
        background: 'linear-gradient(135deg, #0F0C29 0%, #1E1B4B 40%, #2D1B69 100%)',
        position: 'relative',
        overflow: 'hidden',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
      }}
        className="lg:flex"
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: '800', color: '#FFFFFF',
              }}>N</div>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.5px' }}>Nexart</span>
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
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '6px 14px', borderRadius: '999px',
              backgroundColor: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)',
              marginBottom: '24px',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#A5B4FC' }} />
              <span style={{ fontSize: '13px', color: '#A5B4FC', fontWeight: '600' }}>500+ créateurs actifs</span>
            </div>

            <h2 style={{ fontSize: '36px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1.2', marginBottom: '16px', letterSpacing: '-0.5px' }}>
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
                  <CheckCircle2 size={18} color="#6366F1" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5' }}>{f}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats footer */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '32px' }}>
          {[['500+', 'Créateurs'], ['200+', 'Événements'], ['15k+', 'Visiteurs']].map(([n, l]) => (
            <div key={l}>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF' }}>{n}</div>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '48px' }} className="lg:hidden">
          <Image src="/logo-mark.png" alt="Nexart" width={32} height={32} style={{ borderRadius: '8px' }} />
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
              <Link href="/register" style={{ color: '#6366F1', fontWeight: '600', textDecoration: 'none' }}>
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
              border: '1.5px solid #E2E8F0', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              marginBottom: '24px', transition: 'all 200ms ease',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)' }}
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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '12px 16px', borderRadius: '10px',
                backgroundColor: '#FFF1F2', border: '1px solid #FECDD3',
                color: '#BE123C', fontSize: '14px', marginBottom: '20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <span>⚠️</span> {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Adresse email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color={focused === 'email' ? '#6366F1' : 'var(--text-tertiary)'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 200ms' }} />
                <input
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
                    border: focused === 'email' ? '1.5px solid #6366F1' : '1.5px solid #E2E8F0',
                    backgroundColor: focused === 'email' ? '#FAFBFF' : 'var(--bg-secondary)',
                    outline: 'none', transition: 'all 200ms ease', fontFamily: 'inherit',
                    boxShadow: focused === 'email' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Mot de passe
                </label>
                <Link href="/forgot-password" style={{ fontSize: '13px', color: '#6366F1', fontWeight: '500', textDecoration: 'none' }}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color={focused === 'password' ? '#6366F1' : 'var(--text-tertiary)'} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', transition: 'color 200ms' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  style={{
                    width: '100%', padding: '13px 42px 13px 42px',
                    borderRadius: '10px', fontSize: '15px', color: 'var(--text-primary)',
                    border: focused === 'password' ? '1.5px solid #6366F1' : '1.5px solid #E2E8F0',
                    backgroundColor: focused === 'password' ? '#FAFBFF' : 'var(--bg-secondary)',
                    outline: 'none', transition: 'all 200ms ease', fontFamily: 'inherit',
                    boxShadow: focused === 'password' ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
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
                background: loading ? '#A5B4FC' : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#FFFFFF', fontSize: '15px', fontWeight: '700',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.4)',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)' }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.4)' }}
            >
              {loading ? 'Connexion…' : (<>Se connecter <ArrowRight size={16} /></>)}
            </button>
          </form>

          <p style={{ marginTop: '32px', fontSize: '13px', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: '1.6' }}>
            En vous connectant, vous acceptez nos{' '}
            <Link href="/legal/terms" style={{ color: '#6366F1', textDecoration: 'none' }}>CGU</Link>
            {' '}et notre{' '}
            <Link href="/legal/privacy" style={{ color: '#6366F1', textDecoration: 'none' }}>politique de confidentialité</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
