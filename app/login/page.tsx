'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock } from 'lucide-react'
import { SmokeBackground } from '@/components/smoke-background'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      router.push('/')
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
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <SmokeBackground smokeColor="#6366F1" />
      </div>

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ width: '100%', maxWidth: '420px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '32px' }}>
            <ArrowLeft size={16} /> Retour
          </Link>

          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Connexion</h1>
          <p style={{ fontSize: '16px', color: '#888888', marginBottom: '32px' }}>Accédez à votre compte Nexart</p>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogle}
            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FFFFFF', color: '#1A1A1A', fontSize: '15px', fontWeight: '600', border: '1px solid #E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px', transition: 'all 300ms ease' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#9CA3AF'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <GoogleIcon />
            Continuer avec Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>ou</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Mail size={16} color="#6366F1" /> Email
              </label>
              <input
                type="email"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A', fontFamily: 'inherit', transition: 'all 300ms ease' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Lock size={16} color="#6366F1" /> Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A', fontFamily: 'inherit', transition: 'all 300ms ease' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: loading ? '#A5B4FC' : '#6366F1', color: '#FFFFFF', fontSize: '16px', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 300ms ease', marginTop: '8px' }}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div style={{ marginTop: '32px', borderTop: '1px solid #E5E7EB' }} />
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
            <Link href="#" style={{ fontSize: '14px', color: '#888888', textDecoration: 'none' }}>Mot de passe oublié ?</Link>
            <p style={{ fontSize: '14px', color: '#888888', margin: 0 }}>
              Pas encore de compte ?{' '}
              <Link href="/register" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>S'inscrire</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
