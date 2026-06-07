'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Lock, User, Users } from 'lucide-react'
import { SmokeBackground } from '@/components/smoke-background'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/lib/store'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'creator' | 'organizer' | ''>('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) { setError('Sélectionnez un rôle'); return }
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, full_name: fullName, role })

      if (data.user.confirmed_at) {
        setUser({ id: data.user.id, email, role: role as 'creator' | 'organizer', full_name: fullName })
        router.push('/dashboard')
      } else {
        setDone(true)
      }
    }

    setLoading(false)
  }

  const cardStyle = {
    width: '100%',
    maxWidth: '420px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(12px)',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
  }

  if (done) {
    return (
      <div style={{ position: 'relative', minHeight: '100vh' }}>
        <style>{`@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .reg-card { animation: fadeInUp 0.8s ease forwards; }`}</style>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <SmokeBackground smokeColor="#6366F1" />
        </div>
        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
          <div className="reg-card" style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>Vérifiez votre email</h2>
            <p style={{ fontSize: '16px', color: '#888888', lineHeight: '1.6', marginBottom: '24px' }}>
              Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte.
            </p>
            <Link href="/login" style={{ display: 'block', padding: '12px 24px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '16px', fontWeight: '600' }}>
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .reg-card { animation: fadeInUp 0.8s ease forwards; }
        .reg-back:hover { color: #5B5BD6 !important; }
        .reg-btn:hover:not(:disabled) { background-color: #5B5BD6 !important; box-shadow: 0 4px 12px rgba(99,102,241,0.2) !important; }
        .reg-input:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; }
      `}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
        <SmokeBackground smokeColor="#6366F1" />
      </div>

      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div className="reg-card" style={cardStyle}>
          <Link
            href="/"
            className="reg-back"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '32px', transition: 'color 300ms ease' }}
          >
            <ArrowLeft size={16} />
            Retour
          </Link>

          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Inscription</h1>
          <p style={{ fontSize: '16px', color: '#888888', marginBottom: '32px' }}>Créez votre compte Nexart</p>

          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#E05A5A', fontSize: '14px', marginBottom: '20px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <User size={16} color="#6366F1" />
                Nom complet
              </label>
              <input type="text" placeholder="Votre nom" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="reg-input"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A', fontFamily: 'inherit', transition: 'all 300ms ease', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Mail size={16} color="#6366F1" />
                Email
              </label>
              <input type="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} required className="reg-input"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A', fontFamily: 'inherit', transition: 'all 300ms ease', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Users size={16} color="#6366F1" />
                Vous êtes ?
              </label>
              <select value={role} onChange={(e) => setRole(e.target.value as 'creator' | 'organizer' | '')} required className="reg-input"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: role ? '#1A1A1A' : '#AAAAAA', fontFamily: 'inherit', cursor: 'pointer', transition: 'all 300ms ease', boxSizing: 'border-box', outline: 'none' }}
              >
                <option value="">Sélectionnez un rôle</option>
                <option value="creator">Créateur / Artisan</option>
                <option value="organizer">Organisateur</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                <Lock size={16} color="#6366F1" />
                Mot de passe
              </label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="reg-input"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #E5E7EB', backgroundColor: '#FFFFFF', fontSize: '16px', color: '#1A1A1A', fontFamily: 'inherit', transition: 'all 300ms ease', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            <button type="submit" disabled={loading} className="reg-btn"
              style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', backgroundColor: loading ? '#A5A6F6' : '#6366F1', color: '#FFFFFF', fontSize: '16px', fontWeight: '600', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 300ms ease', marginTop: '8px' }}
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>

          <div style={{ marginTop: '32px', borderTop: '1px solid #E5E7EB' }} />
          <p style={{ marginTop: '24px', fontSize: '14px', color: '#888888', textAlign: 'center' }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
