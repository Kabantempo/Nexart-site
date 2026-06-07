'use client'

import { useCreators } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Users, ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'

export default function CreatorsPage() {
  const { creators, loading, error } = useCreators()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCreators = creators.filter(
    (creator) =>
      creator.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      creator.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
          {/* Hero skeleton */}
          <div style={{ width: '38%', height: '52px', backgroundColor: '#F3F4F6', borderRadius: '10px', marginBottom: '16px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ width: '52%', height: '22px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '32px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ height: '48px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '40px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          {/* Cards skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', animation: 'pulse 1.6s ease-in-out infinite', animationDelay: `${i * 0.1}s` }}>
                <div style={{ width: '100%', aspectRatio: '1', backgroundColor: '#F3F4F6' }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ height: '20px', backgroundColor: '#F3F4F6', borderRadius: '6px', marginBottom: '10px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '75%', marginBottom: '6px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '55%', marginBottom: '16px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <p style={{ color: '#E05A5A', fontSize: '16px' }}>Une erreur est survenue. Réessayez dans quelques instants.</p>
      </div>
    )
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero Section */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            Créateurs & Artisans
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', marginBottom: '32px', lineHeight: '1.6' }}>
            Découvrez {filteredCreators.length} créateurs talentueux à travers la France
          </p>
        </motion.div>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={20}
              color="#888888"
              style={{ position: 'absolute', left: '12px', top: '12px' }}
            />
            <input
              type="text"
              placeholder="Rechercher un créateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                borderRadius: '8px',
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                fontSize: '16px',
                color: '#1A1A1A',
                transition: 'all 300ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>

        {/* Creators Grid */}
        {filteredCreators.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {filteredCreators.map((creator, idx) => (
              <motion.div
                key={creator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  href={`/creators/${creator.id}`}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    overflow: 'hidden',
                    backgroundColor: '#FFFFFF',
                    transition: 'all 300ms ease',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6366F1'
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E7EB'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      backgroundColor: '#F5F5F7',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {creator.avatar_url ? (
                      <Image
                        src={creator.avatar_url}
                        alt={creator.full_name}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
                        }}
                      >
                        <Users size={48} color="#FFFFFF" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                      {creator.full_name}
                    </h3>

                    {creator.bio && (
                      <p style={{ fontSize: '14px', color: '#888888', lineHeight: '1.5', marginBottom: '12px' }}>
                        {creator.bio.substring(0, 80)}...
                      </p>
                    )}

                    {/* Location & Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      {creator.city && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={14} color="#6366F1" />
                          <span style={{ fontSize: '12px', color: '#888888' }}>
                            {creator.city}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#6366F1',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      Voir le profil <ArrowRight size={16} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', padding: '80px 24px' }}
          >
            <div style={{ fontSize: '56px', marginBottom: '20px', lineHeight: 1 }}>
              {searchTerm ? '🔍' : '🎨'}
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '10px' }}>
              {searchTerm ? 'Aucun résultat' : 'Aucun créateur inscrit pour le moment'}
            </h3>
            <p style={{ fontSize: '15px', color: '#888888', lineHeight: '1.6', maxWidth: '380px', margin: '0 auto 28px' }}>
              {searchTerm
                ? `Aucun créateur ne correspond à « ${searchTerm} ». Essayez d'autres mots-clés.`
                : 'Les premiers artisans et créateurs arrivent bientôt. Rejoignez la communauté dès maintenant.'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  padding: '10px 24px', borderRadius: '8px', border: '1px solid #6366F1',
                  backgroundColor: 'transparent', color: '#6366F1', fontSize: '14px',
                  fontWeight: '600', cursor: 'pointer',
                }}
              >
                Effacer la recherche
              </button>
            ) : (
              <Link
                href="/register"
                style={{
                  display: 'inline-block', padding: '12px 28px', borderRadius: '8px',
                  backgroundColor: '#6366F1', color: '#FFFFFF', textDecoration: 'none',
                  fontSize: '14px', fontWeight: '600',
                }}
              >
                Rejoindre en tant que créateur
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
