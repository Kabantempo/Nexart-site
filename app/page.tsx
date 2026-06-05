'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Users, MapPin, MessageSquare, Award, Zap, Heart } from 'lucide-react'
import { SmokeBackground } from '@/components/smoke-background'
import { ImageTestimonialGrid } from '@/components/image-testimonial-grid'

export default function Home() {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
      {/* Hero Section with Smoke Background */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Smoke Background */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
          <SmokeBackground smokeColor="#6366F1" />
        </div>

        {/* Content */}
        <section
          style={{
            position: 'relative',
            zIndex: 10,
            paddingTop: '128px',
            paddingBottom: '80px',
            paddingLeft: '16px',
            paddingRight: '16px',
            width: '100%',
          }}
        >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: '48px' }}
          >
            {/* Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Zap size={16} />
              Connexion créateurs & marchés
            </div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              style={{
                fontSize: '56px',
                fontWeight: '700',
                marginBottom: '24px',
                lineHeight: '1.2',
                color: '#FFFFFF',
              }}
            >
              La plateforme des{' '}
              <span style={{ color: '#E5E7EB' }}>marchés artisanaux</span> en France
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                fontSize: '20px',
                marginBottom: '48px',
                maxWidth: '900px',
                margin: '0 auto 48px',
                color: 'rgba(255, 255, 255, 0.8)',
                lineHeight: '1.6',
              }}
            >
              Connectez créateurs, artisans et organisateurs de marchés. Découvrez les meilleures
              opportunités pour exposer vos créations et trouver les talents de demain.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                justifyContent: 'center',
                marginBottom: '64px',
              }}
            >
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  href="/events"
                  style={{
                    padding: '16px 32px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '18px',
                    backgroundColor: '#6366F1',
                    color: '#FFFFFF',
                    textDecoration: 'none',
                    transition: 'all 300ms ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 10px 25px rgba(99, 102, 241, 0.2)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 15px 35px rgba(99, 102, 241, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  Découvrir les événements
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/register"
                  style={{
                    padding: '16px 32px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '18px',
                    backgroundColor: '#FFFFFF',
                    color: '#6366F1',
                    border: '2px solid #6366F1',
                    textDecoration: 'none',
                    transition: 'all 300ms ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.backgroundColor = '#F0F4FF'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.backgroundColor = '#FFFFFF'
                  }}
                >
                  Créer un profil
                </Link>
              </div>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent)',
                margin: '80px 0',
                maxWidth: '400px',
                margin: '80px auto',
              }}
            />

            {/* Download Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px',
                alignItems: 'center',
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <p
                  style={{
                    color: '#FFFFFF',
                    fontSize: '32px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #E5E7EB 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Télécharger Nexart
                </p>
                <p
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '16px',
                    fontWeight: '400',
                    marginTop: '8px',
                  }}
                >
                  Disponible sur iOS et Android
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                style={{
                  display: 'flex',
                  gap: '28px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                {/* App Store Button */}
                <a
                  href="https://apps.apple.com/app/nexart/id6736595834"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 300ms ease',
                    minWidth: '180px',
                    minHeight: '60px',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-8px)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
                  }}
                >
                  <img
                    src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83&releaseDate=1234567890"
                    alt="Télécharger sur l'App Store"
                    style={{
                      height: '60px',
                      width: 'auto',
                      display: 'block',
                      filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))',
                      transition: 'filter 300ms ease',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.target as HTMLImageElement).style.filter = 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4))'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.target as HTMLImageElement).style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))'
                    }}
                  />
                </a>

                {/* Google Play Button */}
                <a
                  href="https://play.google.com/store/apps/details?id=com.nexart.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 300ms ease',
                    minWidth: '180px',
                    minHeight: '80px',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-8px)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'
                  }}
                >
                  <img
                    src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                    alt="Télécharger sur Google Play"
                    style={{
                      height: '80px',
                      width: 'auto',
                      display: 'block',
                      filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))',
                      transition: 'filter 300ms ease',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.target as HTMLImageElement).style.filter = 'drop-shadow(0 12px 24px rgba(0, 0, 0, 0.4))'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.target as HTMLImageElement).style.filter = 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))'
                    }}
                  />
                </a>
              </motion.div>
            </motion.div>

          </motion.div>
        </div>
      </section>
      </section>

      {/* Best Markets Section */}
      <section
        style={{
          padding: '80px 16px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>
              Marchés & Événements à ne pas rater
            </h2>
            <p style={{ fontSize: '18px', color: '#888888', maxWidth: '600px', margin: '0 auto' }}>
              Les meilleurs rendez-vous artisanaux en France cette année
            </p>
          </motion.div>

          <ImageTestimonialGrid
            items={[
              {
                name: 'Salon d\'Automne Créateurs',
                title: 'Paris • 15-17 Nov 2024',
                image: 'https://images.unsplash.com/photo-1469749292166-56156c16147f?w=500&h=700&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=10',
                size: 'large',
              },
              {
                name: 'Pop-up Marché Artisan',
                title: 'Lyon • 1-3 Décembre',
                image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=600&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=11',
                size: 'medium',
              },
              {
                name: 'Marché Permanent Bastille',
                title: 'Paris • Chaque weekend',
                image: 'https://images.unsplash.com/photo-1495576066350-f5f7ab7da3f8?w=400&h=400&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=12',
                size: 'small',
              },
              {
                name: 'Foire Métiers d\'Art',
                title: 'Bordeaux • 5-8 Décembre',
                image: 'https://images.unsplash.com/photo-1519167758993-c74ba48f8a84?w=400&h=400&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=13',
                size: 'small',
              },
              {
                name: 'Marché de Noel Premium',
                title: 'Marseille • 1 Nov - 31 Dec',
                image: 'https://images.unsplash.com/photo-1502882657612-449c28e3e055?w=400&h=600&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=14',
                size: 'medium',
              },
              {
                name: 'Festival des Créateurs',
                title: 'Toulouse • 20-22 Octobre',
                image: 'https://images.unsplash.com/photo-1479237916879-f9b06251a113?w=500&h=500&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=15',
                size: 'large',
              },
            ]}
            columns={3}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginTop: '64px' }}
          >
            <Link
              href="/events"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 32px',
                borderRadius: '8px',
                border: '2px solid #6366F1',
                backgroundColor: 'transparent',
                color: '#6366F1',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 300ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6366F1'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#6366F1'
              }}
            >
              Découvrir tous les événements
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Best Creators Section */}
      <section
        style={{
          padding: '80px 16px',
          backgroundColor: '#F9F9FB',
          borderTop: '1px solid #E5E7EB',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>
              Découvrez nos meilleurs créateurs
            </h2>
            <p style={{ fontSize: '18px', color: '#888888', maxWidth: '600px', margin: '0 auto' }}>
              Les talents les plus en vue de la plateforme Nexart
            </p>
          </motion.div>

          <ImageTestimonialGrid
            items={[
              {
                name: 'Marie Dubois',
                title: 'Céramiste & Sculptrice',
                image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&h=700&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=1',
                size: 'large',
              },
              {
                name: 'Thomas Martin',
                title: 'Tatoueur & Designer',
                image: 'https://images.unsplash.com/photo-1578814050033-9c499bb9a3a7?w=400&h=600&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=2',
                size: 'medium',
              },
              {
                name: 'Sophie Laurent',
                title: 'Joaillière',
                image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=3',
                size: 'small',
              },
              {
                name: 'Julien Beaumont',
                title: 'Graveur & Artisan',
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=4',
                size: 'small',
              },
              {
                name: 'Elena Rodriguez',
                title: 'Textile & Mode',
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=5',
                size: 'medium',
              },
              {
                name: 'Marc Leclerc',
                title: 'Bois & Menuiserie',
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop',
                avatar: 'https://i.pravatar.cc/150?img=6',
                size: 'large',
              },
            ]}
            columns={3}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginTop: '64px' }}
          >
            <Link
              href="/creators"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 32px',
                borderRadius: '8px',
                border: '2px solid #6366F1',
                backgroundColor: 'transparent',
                color: '#6366F1',
                textDecoration: 'none',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 300ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#6366F1'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#FFFFFF'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#6366F1'
              }}
            >
              Découvrir tous les créateurs
              <ArrowRight size={20} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        style={{
          padding: '64px 16px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px',
            }}
          >
            {[
              { value: '500+', label: 'Créateurs & Artisans' },
              { value: '100+', label: 'Marchés & Événements' },
              { value: '2000+', label: 'Candidatures/Mois' },
              { value: '45k+', label: 'Visiteurs/Mois' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                style={{ textAlign: 'center' }}
              >
                <p style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px', color: '#6366F1' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '16px', color: '#888888' }}>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: '80px 16px',
          background: 'linear-gradient(to bottom, #FFFFFF, #F5F5F7)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: '64px' }}
          >
            <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px', color: '#1A1A1A' }}>
              Pourquoi choisir Nexart ?
            </h2>
            <p style={{ fontSize: '18px', color: '#888888' }}>
              Une plateforme complète pensée pour créateurs et organisateurs
            </p>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '32px',
            }}
          >
            {[
              {
                icon: Users,
                title: 'Connectez créateurs & artisans',
                description: 'Accédez à une communauté de tatoueurs, céramistes, joailliers, illustrateurs et bien d\'autres.',
              },
              {
                icon: MapPin,
                title: '100+ marchés en France',
                description: 'Découvrez des pop-ups, salons, foires et marchés permanents près de chez vous.',
              },
              {
                icon: MessageSquare,
                title: 'Communiquez en temps réel',
                description: 'Messagerie instantanée et notifications pour rester connecté avec les organisateurs.',
              },
              {
                icon: Award,
                title: 'Construisez votre réputation',
                description: 'Avis et notations pour établir la confiance et la crédibilité sur la plateforme.',
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                style={{
                  padding: '32px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  backgroundColor: '#FFFFFF',
                  transition: 'box-shadow 300ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  }}
                >
                  <feature.icon size={24} color="#6366F1" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#1A1A1A' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '16px', color: '#888888', lineHeight: '1.5' }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* CTA Section */}
      <section
        style={{
          padding: '80px 16px',
          background: 'linear-gradient(135deg, #6366F1 0%, #5B5BD6 100%)',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          style={{ maxWidth: '900px', margin: '0 auto' }}
        >
          <h2 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '24px', color: '#FFFFFF' }}>
            Prêt à commencer votre aventure ?
          </h2>
          <p style={{ fontSize: '18px', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '48px' }}>
            Rejoignez des centaines de créateurs et organisateurs qui font confiance à Nexart.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                padding: '16px 32px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '18px',
                backgroundColor: '#FFFFFF',
                color: '#6366F1',
                textDecoration: 'none',
                transition: 'all 300ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Créer mon profil
            </Link>
            <Link
              href="/events"
              style={{
                padding: '16px 32px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '18px',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                border: '2px solid #FFFFFF',
                textDecoration: 'none',
                transition: 'all 300ms ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              Voir les événements
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
