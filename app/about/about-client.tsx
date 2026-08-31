'use client'

import { motion } from 'framer-motion'
import { Heart, Target, Zap, Users } from 'lucide-react'
import Link from 'next/link'
import { colors } from '@/lib/design-tokens'

export default function AboutPageClient() {
  const values = [
    {
      icon: Heart,
      title: 'Créateurs avant tout',
      description: 'Chaque décision de produit est prise en pensant à ceux qui fabriquent — pas aux algorithmes.',
    },
    {
      icon: Zap,
      title: 'Simple, pas simpliste',
      description: 'On automatise la complexité pour que l\'expérience soit fluide, pas pour enlever du contrôle.',
    },
    {
      icon: Users,
      title: 'Communauté réelle',
      description: 'Derrière chaque profil, une personne. On construit des outils pour des humains, pas des métriques.',
    },
    {
      icon: Target,
      title: 'Économie locale',
      description: 'Chaque marché facilité, c\'est du revenu qui reste dans des mains d\'artisans français.',
    },
  ]

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 200px)' }}>
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
          <p style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.violet.primary, marginBottom: '12px' }}>
            Qui sommes-nous
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            La plateforme des créateurs<br />qui exposent en marchés
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '640px' }}>
            Nexart connecte artisans, designers et créateurs français avec les marchés et événements artisanaux — candidatures, paiements et contrats réunis en un seul endroit.
          </p>
        </motion.div>
      </div>

      {/* Mission */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '60px 16px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
            Notre mission
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: 'clamp(20px, 5vw, 40px)', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.8', marginBottom: '16px' }}>
                Des milliers de créateurs talentueux peinent à trouver des marchés, et des organisateurs passent des heures à gérer leurs candidatures manuellement.
              </p>
              <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                Nexart automatise tout ce qui peut l&apos;être — dépôt de candidature, sélection, signature de contrat, paiement — pour que créateurs et organisateurs se concentrent sur l&apos;essentiel.
              </p>
            </div>
            <div
              style={{
                padding: '40px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${colors.violet.primary} 0%, ${colors.purple.primary} 100%)`,
                color: '#FFFFFF',
              }}
            >
              <p style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px', lineHeight: 1.1 }}>
                100%<br />gratuit pour commencer
              </p>
              <p style={{ fontSize: '15px', opacity: 0.9, lineHeight: '1.6', margin: 0 }}>
                Créez votre profil, postulez à vos premiers marchés et développez votre activité — sans frais d&apos;inscription.
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
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '40px' }}>
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
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    transition: 'all 300ms ease',
                  }}
                  onMouseEnter={(e: any) => {
                    e.currentTarget.style.borderColor = colors.violet.primary
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.1)'
                  }}
                  onMouseLeave={(e: any) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)'
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
                    <Icon size={24} color={colors.violet.primary} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                    {value.title}
                  </h3>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
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
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
            Votre prochain marché commence ici
          </h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
            Créez votre profil en 5 minutes, accédez à des centaines d&apos;événements et postulez en un clic.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                backgroundColor: colors.violet.primary,
                color: colors.bg.primary,
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 300ms ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.violet.dark
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.violet.primary
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Rejoindre Nexart
            </Link>
            <Link
              href="/events"
              style={{
                padding: '12px 32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                color: colors.violet.primary,
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                border: `1px solid ${colors.border.accent}`,
                transition: 'all 300ms ease',
                display: 'inline-block',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'
              }}
            >
              Voir les marchés
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
