'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Tag, CheckCircle, Globe, Link2 } from 'lucide-react'

interface Props {
  id: string
}

interface CreatorData {
  id: string
  full_name: string
  bio?: string
  avatar_url?: string
  city?: string
  region?: string
  department?: string
  travel_radius?: string
  disciplines?: string[]
  portfolio_images?: string[]
  website?: string
  instagram?: string
  etsy?: string
  siret_verified?: boolean
  insurance_verified?: boolean
  created_at?: string
}

const RADIUS_LABELS: Record<string, string> = {
  '5': '5 km',
  '10': '10 km',
  '25': '25 km',
  national: 'National',
}

export function CreatorProfileClient({ id }: Props) {
  const [creator, setCreator] = useState<CreatorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [{ data: profile }, { data: cp }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', id).single(),
          supabase.from('creator_profiles').select('*').eq('user_id', id).single(),
        ])

        if (!profile) { setError(true); setLoading(false); return }

        setCreator({
          id: profile.id,
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          ...(cp || {}),
        })
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#888888', fontSize: '16px' }}>Chargement...</p>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <p style={{ color: '#E05A5A', fontSize: '16px' }}>Créateur introuvable</p>
        <Link href="/creators" style={{ color: '#6366F1', textDecoration: 'none', marginTop: '16px', display: 'block' }}>
          ← Retour aux créateurs
        </Link>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '40px 16px' }}>
        <Link
          href="/creators"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginBottom: '32px' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#5B5BD6' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6366F1' }}
        >
          <ArrowLeft size={16} />
          Retour aux créateurs
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '32px' }}>
          {/* Main */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, position: 'relative', backgroundColor: '#F5F5F7' }}>
                {creator.avatar_url ? (
                  <Image src={creator.avatar_url} alt={creator.full_name} fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' }}>
                    <span style={{ fontSize: '48px', color: '#FFFFFF', fontWeight: '700' }}>
                      {creator.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' }}>
                  {creator.full_name}
                </h1>
                {creator.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <MapPin size={16} color="#6366F1" />
                    <span style={{ fontSize: '15px', color: '#888888' }}>
                      {creator.city}{creator.region ? `, ${creator.region}` : ''}
                    </span>
                    {creator.travel_radius && (
                      <span style={{ marginLeft: '8px', padding: '2px 10px', borderRadius: '9999px', backgroundColor: '#F0F0FF', color: '#6366F1', fontSize: '13px', fontWeight: '500' }}>
                        {RADIUS_LABELS[creator.travel_radius] || creator.travel_radius}
                      </span>
                    )}
                  </div>
                )}

                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {creator.siret_verified && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#E8F5E9', color: '#4CAF50', fontSize: '12px', fontWeight: '600' }}>
                      <CheckCircle size={14} />
                      SIRET vérifié
                    </div>
                  )}
                  {creator.insurance_verified && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '9999px', backgroundColor: '#E8F5E9', color: '#4CAF50', fontSize: '12px', fontWeight: '600' }}>
                      <CheckCircle size={14} />
                      Assurance RC
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {creator.bio && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>À propos</h2>
                <p style={{ fontSize: '16px', color: '#555555', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
                  {creator.bio}
                </p>
              </div>
            )}

            {/* Disciplines */}
            {creator.disciplines && creator.disciplines.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>
                  <Tag size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                  Disciplines
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {creator.disciplines.map((d: string) => (
                    <span key={d} style={{ padding: '6px 14px', borderRadius: '9999px', backgroundColor: '#F0F0FF', color: '#6366F1', fontSize: '14px', fontWeight: '500' }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio */}
            {creator.portfolio_images && creator.portfolio_images.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A', marginBottom: '12px' }}>Portfolio</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                  {creator.portfolio_images.map((img: string, idx: number) => (
                    <div key={idx} style={{ aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', position: 'relative', backgroundColor: '#F5F5F7' }}>
                      <Image src={img} alt={`Portfolio ${idx + 1}`} fill style={{ objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <div style={{ position: 'sticky', top: '80px', height: 'fit-content' }}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{ borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1A1A1A', marginBottom: '20px' }}>
                Contact
              </h3>

              {/* Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {creator.website && (
                  <a href={creator.website} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px' }}>
                    <Globe size={16} />
                    {creator.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
                {creator.instagram && (
                  <a href={`https://instagram.com/${creator.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366F1', textDecoration: 'none', fontSize: '14px' }}>
                    <Link2 size={16} />
                    @{creator.instagram.replace('@', '')}
                  </a>
                )}
              </div>

              {/* Contact button */}
              {!user ? (
                <Link
                  href="/login"
                  style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none', fontSize: '15px', fontWeight: '600', textAlign: 'center', boxSizing: 'border-box' }}
                >
                  Se connecter pour contacter
                </Link>
              ) : user.id === id ? (
                <Link
                  href="/dashboard"
                  style={{ display: 'block', width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #6366F1', color: '#6366F1', textDecoration: 'none', fontSize: '15px', fontWeight: '600', textAlign: 'center', boxSizing: 'border-box' }}
                >
                  Mon profil (éditer)
                </Link>
              ) : user.role === 'organizer' ? (
                <button
                  style={{ width: '100%', padding: '14px', borderRadius: '8px', backgroundColor: '#6366F1', color: '#FFFFFF', fontSize: '15px', fontWeight: '600', border: 'none', cursor: 'pointer', transition: 'all 300ms ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#5B5BD6' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#6366F1' }}
                  onClick={() => alert('Messagerie bientôt disponible !')}
                >
                  Contacter
                </button>
              ) : null}

              {creator.created_at && (
                <p style={{ fontSize: '12px', color: '#AAAAAA', textAlign: 'center', marginTop: '16px' }}>
                  Membre depuis {new Date(creator.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
