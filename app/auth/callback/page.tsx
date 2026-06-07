'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get('code')

      if (code) {
        const { data, error: err } = await supabase.auth.exchangeCodeForSession(code)
        if (err) { setError(err.message); return }

        if (data.session?.user) {
          const user = data.session.user
          // Crée le profil si c'est la première connexion Google
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single()

          if (!existing) {
            await supabase.from('profiles').insert({
              id: user.id,
              full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url ?? null,
              role: null,
            })
          }
          router.push('/')
        }
      } else {
        // Fallback : session déjà active (connexion email/password)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) router.push('/')
        else setError('Aucune session trouvée. Veuillez réessayer.')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0D0D' }}>
      <div style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <p style={{ color: '#E05A5A', fontSize: '16px', marginBottom: '16px' }}>{error}</p>
            <a href="/login" style={{ color: '#6366F1', fontSize: '14px', fontWeight: '600' }}>Retour à la connexion</a>
          </>
        ) : (
          <>
            <div style={{
              width: '48px', height: '48px',
              border: '3px solid #6366F1', borderTopColor: 'transparent',
              borderRadius: '50%', animation: 'spin 1s linear infinite',
              margin: '0 auto 24px',
            }} />
            <p style={{ color: '#888888', fontSize: '16px' }}>Connexion en cours…</p>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
