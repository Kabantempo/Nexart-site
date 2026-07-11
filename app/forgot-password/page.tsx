'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail } from 'lucide-react'
import { SmokeBackground } from '@/components/smoke-background'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (err) {
      setError(err.message)
    } else {
      setSent(true)
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
          <Link
            href="/login"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '32px' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#5B5BD6' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6366F1' }}
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </Link>

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Email envoyé
              </h2>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Un lien de réinitialisation a été envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Mot de passe oublié
              </h1>
              <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px' }}>
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>

              {error && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#E05A5A', fontSize: '14px', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    <Mail size={16} color="#6366F1" />
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="vous@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                  {loading ? 'Envoi...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
