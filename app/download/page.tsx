'use client'

import { motion } from 'framer-motion'
import { Download, Apple, Smartphone } from 'lucide-react'

export default function DownloadPage() {
  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero */}
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '60px 16px',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
            Télécharger l'application Nexart
          </h1>
          <p style={{ fontSize: '18px', color: '#888888', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
            Accédez à tous les événements artisanaux directement sur votre téléphone
          </p>
        </motion.div>

        {/* Download Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          <motion.a
            href="#"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              borderRadius: '8px',
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 300ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2A2A2A'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 26, 26, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1A1A1A'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Apple size={20} />
            App Store
          </motion.a>

          <motion.a
            href="#"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              borderRadius: '8px',
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 300ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2A2A2A'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(26, 26, 26, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1A1A1A'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Smartphone size={20} />
            Google Play
          </motion.a>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '60px',
            borderTop: '1px solid #E5E7EB',
            paddingTop: '60px',
          }}
        >
          {[
            {
              title: 'Découvrez les marchés',
              description: 'Trouvez les meilleurs événements artisanaux près de chez vous',
              icon: '🗺️',
            },
            {
              title: 'Candidatez facilement',
              description: 'Postulez aux événements en un seul clic',
              icon: '✅',
            },
            {
              title: 'Communiquez en direct',
              description: 'Échangez avec les organisateurs en temps réel',
              icon: '💬',
            },
            {
              title: 'Gérez vos candidatures',
              description: 'Suivez l\'état de vos candidatures en temps réel',
              icon: '📊',
            },
            {
              title: 'Paiements sécurisés',
              description: 'Réglez les stands directement dans l\'app',
              icon: '💳',
            },
            {
              title: 'Avis et notation',
              description: 'Évaluez votre expérience après chaque événement',
              icon: '⭐',
            },
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
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
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#888888', lineHeight: '1.6' }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{
            padding: '40px',
            borderRadius: '12px',
            backgroundColor: '#F5F5F7',
            border: '1px solid #E5E7EB',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#1A1A1A', marginBottom: '16px' }}>
            Rejoignez la communauté Nexart
          </h2>
          <p style={{ fontSize: '16px', color: '#888888', marginBottom: '24px' }}>
            Téléchargez l'app et commencez à explorer les événements dès aujourd'hui
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#"
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
                e.style.backgroundColor = '#5B5BD6'
                e.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.style.backgroundColor = '#6366F1'
                e.style.boxShadow = 'none'
              }}
            >
              App Store
            </a>
            <a
              href="#"
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
                e.style.backgroundColor = '#5B5BD6'
                e.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.style.backgroundColor = '#6366F1'
                e.style.boxShadow = 'none'
              }}
            >
              Google Play
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
