'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, Lock, User, Users } from 'lucide-react'
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

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMsg, setResendMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) { setError('Veuillez sélectionner un rôle.'); return }
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, role } },
    })

    if (err) {
      setError(err.message === 'User already registered'
        ? 'Un compte existe déjà avec cet email.'
        : err.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: name,
        role,
      })
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
    const { error: err } = await supabase.auth.resend({ type: 'signup', email })
    if (err) setResendMsg('Erreur : ' + err.message)
    else setResendMsg('Email renvoyé !')
    setResending(false)
  }

  if (success) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}><SmokeBackground smokeColor="#6366F1" /></div>
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ width: '100%', maxWidth: '420px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', padding: '40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Vérifiez vos emails</h2>
            <p style={{ fontSize: '15px', color: '#888888', lineHeight: '1.6', marginBottom: '24px' }}>
              Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte.
            </p>
            <Link href="/login" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
              Aller à la connexion
            </Link>
            <div style={{ marginTop: '16px' }}>
              {resendMsg ? (
                <p style={{ fontSize: '13px', color: resendMsg.startsWith('Erreur') ? '#DC2626' : '#059669', margin: 0 }}>{resendMsg}</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', color: '#6366F1', fontSize: '13px', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline', opacity: resending ? 0.6 : 1 }}
                >
                  {resending ? 'Envoi…' : 'Renvoyer le mail de confirmation'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
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

          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Inscription</h1>
          <p style={{ fontSize: '16px', color: '#888888', marginBottom: '32px' }}>Créez votre compte Nexart</p>

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
            <span style={{ fontSize: '13px', color: '#9CA3AF' }}>ou</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#E5E7EB' }} />
          </div>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <User size={16} color="#6366F1" /> Nom complet
              </label>
              <input type="text" placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A', fontFamily: 'inherit', transition: 'all 300ms ease' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Mail size={16} color="#6366F1" /> Email
              </label>
              <input type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A', fontFamily: 'inherit', transition: 'all 300ms ease' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Users size={16} color="#6366F1" /> Vous êtes ?
              </label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: role ? '#1A1A1A' : '#9CA3AF', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 300ms ease' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <option value="">Sélectionnez un rôle</option>
                <option value="creator">Créateur / Artisan</option>
                <option value="organizer">Organisateur</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Lock size={16} color="#6366F1" /> Mot de passe
              </label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
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
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>

          <div style={{ marginTop: '32px', borderTop: '1px solid #E5E7EB' }} />
          <p style={{ marginTop: '24px', fontSize: '14px', color: '#888888', textAlign: 'center', margin: '24px 0 0' }}>
            Vous avez déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>Se connecter</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
