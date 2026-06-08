'use client'

import { motion } from 'framer-motion'
import { Download, Smartphone } from 'lucide-react'

const APK_URL = 'https://expo.dev/accounts/kaban13/projects/nexart/builds/604eb84c-7009-4d6f-94e0-740580f17b24'

export default function DownloadPage() {
  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: '60px' }}
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
          {/* APK Android */}
          <motion.a
            href={APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              borderRadius: '8px',
              backgroundColor: '#6366F1',
              color: '#FFFFFF',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 300ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5B5BD6'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6366F1'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Download size={20} />
            Télécharger l'APK Android
          </motion.a>

          {/* App Store — indisponible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              borderRadius: '8px',
              backgroundColor: '#F3F4F6',
              color: '#9CA3AF',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'default',
              border: '1px solid #E5E7EB',
            }}
          >
            <Smartphone size={20} />
            App Store — bientôt disponible
          </motion.div>
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
            { title: 'Découvrez les marchés', description: 'Trouvez les meilleurs événements artisanaux près de chez vous', icon: '🗺️' },
            { title: 'Candidatez facilement', description: 'Postulez aux événements en un seul clic', icon: '✅' },
            { title: 'Communiquez en direct', description: 'Échangez avec les organisateurs en temps réel', icon: '💬' },
            { title: 'Gérez vos candidatures', description: 'Suivez l\'état de vos candidatures en temps réel', icon: '📊' },
            { title: 'Paiements sécurisés', description: 'Réglez les stands directement dans l\'app', icon: '💳' },
            { title: 'Avis et notation', description: 'Évaluez votre expérience après chaque événement', icon: '⭐' },
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
              onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.1)'
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                e.currentTarget.style.borderColor = '#E5E7EB'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>{feature.icon}</div>
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
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#FFF', marginBottom: '16px' }}>
            Rejoignez la communauté Nexart
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', marginBottom: '24px' }}>
            Téléchargez l'APK et commencez à explorer les événements dès aujourd'hui
          </p>
          <a
            href={APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 32px',
              borderRadius: '8px',
              backgroundColor: '#FFF',
              color: '#6366F1',
              textDecoration: 'none',
              fontSize: '16px',
              fontWeight: '700',
              transition: 'all 300ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F7'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFF'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <Download size={18} />
            Télécharger l'APK Android
          </a>
        </motion.div>
      </div>
    </div>
  )
}
