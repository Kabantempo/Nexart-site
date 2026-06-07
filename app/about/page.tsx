'use client'

import { motion } from 'framer-motion'
import { Heart, Target, Zap, Users } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  const values = [
    {
      icon: Heart,
      title: 'Authenticité',
      description: 'Nous célébrons l\'artisanat authentique et les créateurs talentueux',
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Technologie au service de la relation créateurs-marchés',
    },
    {
      icon: Users,
      title: 'Communauté',
      description: 'Créer un réseau vibrant et solidaire d\'artisans français',
    },
    {
      icon: Target,
      title: 'Impact',
      description: 'Soutenir l\'économie créative locale et durable',
    },
  ]

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '60px 16px 40px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
            À propos de Nexart
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', lineHeight: '1.6', maxWidth: '600px' }}>
            Nexart est la plateforme de mise en relation entre créateurs, artisans et
            marchés artisanaux en France.
          </p>
        </motion.div>
      </div>

      {/* Mission */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '60px 16px',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#1A1A1A', marginBottom: '24px' }}>
            Notre Mission
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '18px', color: '#888888', lineHeight: '1.8', marginBottom: '16px' }}>
                Connecter les créateurs, artisans et designers français avec les marchés et événements
                artisanaux où ils peuvent exposer et vendre leurs œuvres.
              </p>
              <p style={{ fontSize: '18px', color: '#888888', lineHeight: '1.8' }}>
                Nous facilitons la mise en relation, les candidatures, les paiements et la communication
                pour une expérience fluide et professionnelle.
              </p>
            </div>
            <div
              style={{
                padding: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                color: '#FFF',
              }}
            >
              <p style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 12px' }}>
                Disponible sur iOS & Android
              </p>
              <p style={{ fontSize: '14px', opacity: 0.85, lineHeight: '1.6', margin: 0 }}>
                Téléchargez l&apos;application Nexart et gérez vos candidatures, marchés et messages où que vous soyez.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Values */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '60px 16px',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#1A1A1A', marginBottom: '40px' }}>
            Nos Valeurs
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '24px',
            }}
          >
            {values.map((value) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  style={{
                    padding: '24px',
                    borderRadius: '12px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: '#FFFFFF',
                    transition: 'all 300ms ease',
                  }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.borderColor = '#6366F1'
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.1)'
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.borderColor = '#E5E7EB'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <Icon size={24} color="#6366F1" />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                    {value.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#888888', lineHeight: '1.6' }}>
                    {value.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* CTA */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '60px 16px',
          textAlign: 'center',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#1A1A1A', marginBottom: '24px' }}>
            Prêt à vous lancer ?
          </h2>
          <p style={{ fontSize: '16px', color: '#888888', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Rejoignez la communauté Nexart et découvrez de nouvelles opportunités
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                backgroundColor: '#6366F1',
                color: '#FFFFFF',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 300ms ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5B5BD6'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6366F1'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              S'inscrire
            </Link>
            <Link
              href="/login"
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                color: '#6366F1',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                border: '1px solid #6366F1',
                transition: 'all 300ms ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF'
              }}
            >
              Se connecter
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
