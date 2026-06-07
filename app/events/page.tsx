'use client'

import { useEvents } from '@/lib/hooks'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Calendar, ArrowRight, Search } from 'lucide-react'
import { useState } from 'react'

export default function EventsPage() {
  const { events, loading, error } = useEvents()
  const [searchTerm, setSearchTerm] = useState('')

  const filteredEvents = events.filter(
    (event) =>
      event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 40px' }}>
          {/* Hero skeleton */}
          <div style={{ width: '42%', height: '52px', backgroundColor: '#F3F4F6', borderRadius: '10px', marginBottom: '16px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ width: '55%', height: '22px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '32px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          <div style={{ height: '48px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginBottom: '40px', animation: 'pulse 1.6s ease-in-out infinite' }} />
          {/* Cards skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', animation: 'pulse 1.6s ease-in-out infinite', animationDelay: `${i * 0.1}s` }}>
                <div style={{ height: '200px', backgroundColor: '#F3F4F6' }} />
                <div style={{ padding: '20px' }}>
                  <div style={{ height: '20px', backgroundColor: '#F3F4F6', borderRadius: '6px', marginBottom: '12px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '65%', marginBottom: '8px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '45%', marginBottom: '16px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '80%', marginBottom: '6px' }} />
                  <div style={{ height: '14px', backgroundColor: '#F3F4F6', borderRadius: '6px', width: '60%' }} />
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
            Événements & Marchés
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', marginBottom: '32px', lineHeight: '1.6' }}>
            Découvrez {filteredEvents.length} événements artisanaux en France
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
              placeholder="Rechercher un événement..."
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

        {/* Events Grid */}
        {filteredEvents.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Link
                  href={`/events/${event.id}`}
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
                  {/* Cover Image */}
                  <div
                    style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: '#F5F5F7',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {event.cover_image ? (
                      <Image
                        src={event.cover_image}
                        alt={event.title}
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
                        <Calendar size={48} color="#FFFFFF" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                      {event.title}
                    </h3>

                    {/* Date & Location */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {event.start_date && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} color="#6366F1" />
                          <span style={{ fontSize: '14px', color: '#888888' }}>
                            {new Date(event.start_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      )}
                      {event.location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MapPin size={16} color="#6366F1" />
                          <span style={{ fontSize: '14px', color: '#888888' }}>
                            {event.location}
                          </span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p style={{ fontSize: '14px', color: '#888888', lineHeight: '1.5', marginBottom: '16px' }}>
                        {event.description.substring(0, 100)}...
                      </p>
                    )}

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
                      Voir plus <ArrowRight size={16} />
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
              {searchTerm ? '🔍' : '📅'}
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A', marginBottom: '10px' }}>
              {searchTerm ? 'Aucun résultat' : 'Aucun événement pour le moment'}
            </h3>
            <p style={{ fontSize: '15px', color: '#888888', lineHeight: '1.6', maxWidth: '380px', margin: '0 auto 28px' }}>
              {searchTerm
                ? `Aucun événement ne correspond à « ${searchTerm} ». Essayez d'autres mots-clés.`
                : 'Les premiers marchés et salons arrivent bientôt. Inscrivez-vous pour être parmi les premiers notifiés.'}
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
                Créer un compte gratuit
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
