'use client'
import { motion } from 'framer-motion'
import { Building2, User, Server, Mail, AlertCircle, Shield } from 'lucide-react'

export default function MentionsLegalesClient() {
  const sections = [
    {
      title: 'Éditeur du Site',
      icon: Building2,
      items: [
        { label: 'Raison Sociale', value: 'Nexart SAS' },
        { label: 'Forme Juridique', value: 'Société par Actions Simplifiée (SAS)' },
        { label: 'SIRET', value: '[À mettre à jour avec SIRET réel]' },
        { label: 'Code NAF', value: '63.12Z - Traitement données & hébergement' },
        { label: 'Siège Social', value: 'Marseille, France' },
        { label: 'Adresse Complète', value: '[À mettre à jour avec adresse réelle]' },
      ],
    },
    {
      title: 'Directeur de Publication',
      icon: User,
      items: [
        { label: 'Nom', value: 'Kalvin' },
        { label: 'Fonction', value: 'Fondateur & Responsable Légal' },
        { label: 'Email', value: 'kalvin@nexart.fr' },
      ],
    },
    {
      title: 'Responsable RGPD',
      icon: Shield,
      items: [
        { label: 'Nom', value: 'Kalvin' },
        { label: 'Email', value: 'kalvin@nexart.fr' },
        { label: 'Fonction', value: 'Responsable Protection Données' },
      ],
    },
    {
      title: 'Hébergeur du Site',
      icon: Server,
      items: [
        { label: 'Nom', value: 'Vercel Inc.' },
        { label: 'Localisation', value: 'États-Unis / Régions EU' },
        { label: 'Site Web', value: 'https://vercel.com' },
        { label: 'Support', value: 'https://vercel.com/support' },
      ],
    },
    {
      title: 'Hébergeur Base de Données',
      icon: Server,
      items: [
        { label: 'Nom', value: 'Supabase' },
        { label: 'Localisation', value: 'EU (Frankfurt)' },
        { label: 'Site Web', value: 'https://supabase.com' },
        { label: 'DPA Signé', value: '27 juillet 2026' },
      ],
    },
    {
      title: 'Contact Support',
      icon: Mail,
      items: [
        { label: 'Email Principal', value: 'kalvin@nexart.fr' },
        { label: 'Formulaire Contact', value: 'https://nexart.fr/contact' },
        { label: 'Délai de Réponse', value: 'Sous 24-48 heures' },
      ],
    },
  ]

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero Section */}
      <div style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 16px 60px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px' }}>
              Mentions Légales
            </h1>
            <p style={{ fontSize: '18px', color: '#888888', maxWidth: '600px', lineHeight: '1.6' }}>
              Informations légales requises de la plateforme Nexart. Consulter pour entreprise, contact légal et hébergeur.
            </p>
            <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '24px' }}>
              Dernière mise à jour : 11 juillet 2026
            </p>
          </motion.div>
        </div>
      </div>

      {/* Content Sections */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px' }}>
        {sections.map((section, idx) => {
          const IconComponent = section.icon
          return (
            <motion.section
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              style={{
                marginBottom: '60px',
                paddingBottom: '60px',
                borderBottom: idx < sections.length - 1 ? '1px solid #E5E7EB' : 'none',
              }}
            >
              {/* Section Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px' }}>
                <div style={{ marginTop: '4px' }}>
                  <IconComponent size={32} color="#FF6B6B" strokeWidth={1.5} />
                </div>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>
                  {section.title}
                </h2>
              </div>

              {/* Items Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '24px',
                }}
              >
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '20px',
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#9CA3AF',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        marginBottom: '8px',
                      }}
                    >
                      {item.label}
                    </p>
                    <p style={{ fontSize: '16px', color: '#1A1A1A', fontWeight: 500, lineHeight: '1.6' }}>
                      {item.value.startsWith('http') ? (
                        <a
                          href={item.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: '#FF6B6B',
                            textDecoration: 'none',
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}
                        >
                          {item.value}
                        </a>
                      ) : (
                        item.value
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </motion.section>
          )
        })}

        {/* Legal Info Sections */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          style={{
            marginBottom: '60px',
            paddingBottom: '60px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px' }}>
            <AlertCircle size={32} color="#FF6B6B" strokeWidth={1.5} />
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>
              Propriété Intellectuelle
            </h2>
          </div>
          <div style={{ backgroundColor: '#F9FAFB', padding: '24px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '16px' }}>
              Tous les contenus du site Nexart (textes, logos, images, vidéos, codes, etc.) sont la propriété intellectuelle de Nexart SAS ou de ses partenaires. Toute reproduction, représentation ou diffusion, intégrale ou partielle, du contenu sans autorisation écrite est interdite.
            </p>
            <p style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8' }}>
              © 2024-2026 Nexart SAS. Tous droits réservés.
            </p>
          </div>
        </motion.section>

        {/* Data Protection Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          style={{
            marginBottom: '60px',
            paddingBottom: '60px',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px' }}>
            <Shield size={32} color="#FF6B6B" strokeWidth={1.5} />
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>
              Protection des Données Personnelles
            </h2>
          </div>
          <div style={{ backgroundColor: '#F9FAFB', padding: '24px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '16px' }}>
              Nexart traite les données personnelles en conformité avec le Règlement Général sur la Protection des Données (RGPD) et les lois françaises applicables.
            </p>
            <ul style={{ marginLeft: '20px', marginBottom: '16px' }}>
              <li style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '12px', listStyleType: 'disc' }}>
                <strong>Responsable du traitement</strong> : Kalvin, kalvin@nexart.fr
              </li>
              <li style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '12px', listStyleType: 'disc' }}>
                <strong>Politique de Confidentialité</strong> : <a href="/confidentialite" style={{ color: '#FF6B6B', textDecoration: 'none' }}>Lire la politique complète</a>
              </li>
              <li style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '12px', listStyleType: 'disc' }}>
                <strong>Droits RGPD</strong> : accès, rectification, suppression, opposition, portabilité
              </li>
              <li style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', listStyleType: 'disc' }}>
                <strong>Exercer vos droits</strong> : contactez kalvin@nexart.fr
              </li>
            </ul>
          </div>
        </motion.section>

        {/* Compliance Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '32px' }}>
            <AlertCircle size={32} color="#FF6B6B" strokeWidth={1.5} />
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#1A1A1A' }}>
              Conformité Légale
            </h2>
          </div>
          <div style={{ backgroundColor: '#F9FAFB', padding: '24px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
            <p style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '16px' }}>
              Nexart respecte toutes les obligations légales applicables en France, notamment :
            </p>
            <ul style={{ marginLeft: '20px' }}>
              <li style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '12px', listStyleType: 'disc' }}>
                Loi RGPD (Protection des données)
              </li>
              <li style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '12px', listStyleType: 'disc' }}>
                Loi Informatique et Libertés (LIL)
              </li>
              <li style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '12px', listStyleType: 'disc' }}>
                Loi e-commerce (Directive 2000/31/CE)
              </li>
              <li style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', marginBottom: '12px', listStyleType: 'disc' }}>
                Droit de la consommation
              </li>
              <li style={{ fontSize: '16px', color: '#666666', lineHeight: '1.8', listStyleType: 'disc' }}>
                Droit d'auteur et propriété intellectuelle
              </li>
            </ul>
          </div>
        </motion.section>
      </div>

      {/* Footer Links */}
      <div style={{ backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB', marginTop: '60px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Légal
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a href="/conditions" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Conditions d'Utilisation
                  </a>
                </li>
                <li style={{ marginBottom: '8px' }}>
                  <a href="/confidentialite" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Politique de Confidentialité
                  </a>
                </li>
                <li>
                  <a href="/mentions-legales" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Mentions Légales
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                Support
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: '8px' }}>
                  <a href="/contact" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Contact Support
                  </a>
                </li>
                <li>
                  <a href="mailto:kalvin@nexart.fr" style={{ color: '#FF6B6B', textDecoration: 'none', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#E53E3E')} onMouseLeave={(e) => (e.currentTarget.style.color = '#FF6B6B')}>
                    Email: kalvin@nexart.fr
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
