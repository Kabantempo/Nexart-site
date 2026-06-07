'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'

export default function FavoritesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setLoading(false)
    })
  }, [router])

  if (loading) return null

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 16px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Favoris</h1>
        <p style={{ fontSize: '16px', color: '#888888', marginBottom: '48px' }}>Les événements et créateurs que vous avez aimés</p>

        <div style={{ textAlign: 'center', padding: '80px 24px', borderRadius: '16px', border: '1px dashed #E5E7EB', backgroundColor: '#FAFAFA' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#FFF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Heart size={32} color="#E05A5A" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>Aucun favori pour l'instant</h3>
          <p style={{ fontSize: '15px', color: '#888888', lineHeight: '1.6', maxWidth: '340px', margin: '0 auto 24px' }}>
            Likez des événements ou des créateurs pour les retrouver ici rapidement.
          </p>
          <button
            onClick={() => router.push('/events')}
            style={{ padding: '12px 28px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            Explorer les év��nements
          </button>
        </div>
      </motion.div>
    </div>
  )
}
