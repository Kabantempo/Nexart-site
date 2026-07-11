'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { SmokeBackground } from '@/components/smoke-background'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery mode
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return }
    if (password.length < 6) { setError('Minimum 6 caractères'); return }
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    }
    setLoading(false)
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
          style={{ width: '100%', maxWidth: '420px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.2)', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)', padding: '40px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)' }}
        >
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Mot de passe mis à jour
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>
                Redirection vers la connexion...
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Nouveau mot de passe
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Choisissez votre nouveau mot de passe
              </p>

              {error && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#E05A5A', fontSize: '14px', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    <Lock size={16} color="#6366F1" />
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'all 300ms ease', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    <Lock size={16} color="#6366F1" />
                    Confirmer
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', fontSize: '16px', color: 'var(--text-primary)', fontFamily: 'inherit', transition: 'all 300ms ease', boxSizing: 'border-box' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: loading ? '#A5A6F6' : '#6366F1', color: '#FFFFFF', fontSize: '16px', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 300ms ease' }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#5B5BD6' }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#6366F1' }}
                >
                  {loading ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </form>

              <p style={{ marginTop: '24px', fontSize: '14px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                <Link href="/login" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>
                  Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
