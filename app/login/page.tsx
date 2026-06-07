'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock } from 'lucide-react'
import { SmokeBackground } from '@/components/smoke-background'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        setUser({
          id: profile.id,
          email: data.user.email || email,
          role: profile.role,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        })
      }
      router.push('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .login-card { animation: fadeInUp 0.8s ease forwards; }
        .login-back:hover { color: #5B5BD6 !important; }
        .login-btn:hover:not(:disabled) { background-color: #5B5BD6 !important; box-shadow: 0 4px 12px rgba(99,102,241,0.2) !important; }
        .login-link:hover { color: #6366F1 !important; }
        .login-input:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; }
      `}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <SmokeBackground smokeColor="#6366F1" />
      </div>

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div
          className="login-card"
          style={{
            width: '100%',
            maxWidth: '420px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            padding: '40px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Link
            href="/"
            className="login-back"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '32px', transition: 'color 300ms ease' }}
          >
            <ArrowLeft size={16} />
            Retour
          </Link>

          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Connexion</h1>
          <p style={{ fontSize: '16px', color: '#888888', marginBottom: '32px' }}>Accédez à votre compte Nexart</p>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#E05A5A', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Mail size={16} color="#6366F1" />
                Email
              </label>
              <input
                type="email"
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="login-input"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A', fontFamily: 'inherit', transition: 'all 300ms ease', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Lock size={16} color="#6366F1" />
                Mot de passe
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="login-input"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A', fontFamily: 'inherit', transition: 'all 300ms ease', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-btn"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: loading ? '#A5A6F6' : '#6366F1', color: '#FFFFFF', fontSize: '16px', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 300ms ease', marginTop: '8px' }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div style={{ marginTop: '32px', borderTop: '1px solid #E5E7EB' }} />

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'center' }}>
            <Link
              href="/forgot-password"
              className="login-link"
              style={{ fontSize: '14px', color: '#888888', textDecoration: 'none', textAlign: 'center', display: 'block', transition: 'color 200ms ease' }}
            >
              Mot de passe oublié ?
            </Link>
            <p style={{ fontSize: '14px', color: '#888888', margin: 0, textAlign: 'center' }}>
              Pas encore de compte ?{' '}
              <Link href="/register" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
