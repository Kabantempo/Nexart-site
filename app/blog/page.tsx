'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Clock, ArrowRight, BookOpen, Tag } from 'lucide-react'
import { ARTICLES, type Article } from '@/lib/blog-data'

const CATEGORIES = [
  { key: 'all', label: 'Tous les articles' },
  { key: 'créateurs', label: 'Guides créateurs' },
  { key: 'organisateurs', label: 'Conseils organisateurs' },
  { key: 'actualités', label: 'Actualités Nexart' },
] as const

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  'créateurs':    { color: '#6366F1', bg: '#EEF2FF' },
  'organisateurs':{ color: '#06B6D4', bg: '#ECFEFF' },
  'actualités':   { color: '#10B981', bg: '#ECFDF5' },
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  const cat = CATEGORY_COLORS[article.category]
  const d = new Date(article.date)
  const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Link href={`/blog/${article.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <motion.article
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.07 }}
        style={{
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          overflow: 'hidden',
          backgroundColor: '#FFF',
          display: 'flex',
          flexDirection: 'column',
          transition: 'box-shadow 0.2s, transform 0.2s',
          cursor: 'pointer',
          height: '100%',
        }}
        whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      >
        {/* Cover */}
        <div style={{
          height: '160px',
          background: article.gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '52px',
          flexShrink: 0,
          position: 'relative',
        }}>
          {article.icon}
          <span style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            fontSize: '11px',
            fontWeight: '700',
            padding: '3px 10px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255,255,255,0.25)',
            color: '#FFF',
            backdropFilter: 'blur(4px)',
            textTransform: 'capitalize',
          }}>
            {article.category}
          </span>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 20px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', fontSize: '12px', color: '#9CA3AF' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {article.readTime} min
            </span>
            <span>·</span>
            <span>{dateStr}</span>
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1A1A1A', margin: '0 0 8px', lineHeight: '1.4' }}>
            {article.title}
          </h3>

          <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6', margin: '0 0 16px', flex: 1 }}>
            {article.excerpt}
          </p>

          {/* Tags + CTA */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {article.tags.slice(0, 2).map(tag => (
                <span key={tag} style={{
                  fontSize: '11px', fontWeight: '600',
                  padding: '2px 8px', borderRadius: '10px',
                  backgroundColor: cat.bg, color: cat.color,
                }}>
                  {tag}
                </span>
              ))}
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#6366F1' }}>
              Lire <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [email, setEmail] = useState('')
  const [newsletterState, setNewsletterState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [newsletterMsg, setNewsletterMsg] = useState('')

  const filtered = activeCategory === 'all'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === activeCategory)

  const featured = ARTICLES[0]

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setNewsletterState('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setNewsletterState('success')
        setNewsletterMsg(data.message || 'Inscription confirmée !')
        setEmail('')
      } else {
        setNewsletterState('error')
        setNewsletterMsg(data.error || 'Une erreur est survenue')
      }
    } catch {
      setNewsletterState('error')
      setNewsletterMsg('Erreur de connexion, réessayez.')
    }
  }

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 80px' }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <BookOpen size={20} color="#6366F1" />
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Ressources & Guides
            </span>
          </div>
          <h1 style={{ fontSize: '48px', fontWeight: 700, color: '#1A1A1A', marginBottom: '16px', lineHeight: '1.15' }}>
            Le Blog Nexart
          </h1>
          <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '40px', lineHeight: '1.6', maxWidth: '600px' }}>
            Conseils pratiques, guides métier et actualités pour créateurs et organisateurs de marchés artisanaux.
          </p>
        </motion.div>

        {/* Article à la une */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Link href={`/blog/${featured.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #E5E7EB',
                marginBottom: '48px',
                display: 'flex',
                flexDirection: 'row',
                minHeight: '260px',
                cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.12)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div style={{
                flex: '0 0 340px',
                background: featured.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
              }}>
                {featured.icon}
              </div>
              <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '700',
                    padding: '3px 10px', borderRadius: '20px',
                    backgroundColor: CATEGORY_COLORS[featured.category].bg,
                    color: CATEGORY_COLORS[featured.category].color,
                    textTransform: 'capitalize',
                  }}>
                    {featured.category}
                  </span>
                  <span style={{ fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {featured.readTime} min · À la une
                  </span>
                </div>
                <h2 style={{ fontSize: '26px', fontWeight: '800', color: '#1A1A1A', margin: '0 0 12px', lineHeight: '1.3' }}>
                  {featured.title}
                </h2>
                <p style={{ fontSize: '15px', color: '#6B7280', lineHeight: '1.7', margin: '0 0 20px' }}>
                  {featured.excerpt}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {featured.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: '12px', fontWeight: '600',
                      padding: '4px 12px', borderRadius: '20px',
                      backgroundColor: '#EEF2FF', color: '#6366F1',
                    }}>
                      <Tag size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{tag}
                    </span>
                  ))}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '700', color: '#6366F1', marginLeft: 'auto' }}>
                    Lire l&apos;article <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Filtres catégories */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '8px 18px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: activeCategory === cat.key ? '#6366F1' : '#F3F4F6',
                color: activeCategory === cat.key ? '#FFF' : '#4B5563',
                transition: 'all 0.15s',
                fontFamily: 'inherit',
              }}
            >
              {cat.label}
              <span style={{ marginLeft: '6px', fontSize: '12px', opacity: 0.75 }}>
                {cat.key === 'all' ? `(${ARTICLES.length})` : `(${ARTICLES.filter(a => a.category === cat.key).length})`}
              </span>
            </button>
          ))}
        </div>

        {/* Grille articles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {filtered.map((article, i) => (
            <ArticleCard key={article.id} article={article} index={i} />
          ))}
        </div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          style={{
            marginTop: '64px',
            padding: '48px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            textAlign: 'center',
            color: '#FFF',
          }}
        >
          <h3 style={{ fontSize: '26px', fontWeight: '800', margin: '0 0 12px' }}>
            Restez informé des tendances artisanales
          </h3>
          <p style={{ fontSize: '15px', opacity: 0.85, margin: '0 0 28px', lineHeight: '1.6' }}>
            Nouveaux guides, sélections de marchés et actualités Nexart — une fois par mois, pas plus.
          </p>

          {newsletterState === 'success' ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 24px', borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.2)', color: '#FFF',
              fontSize: '15px', fontWeight: '600',
            }}>
              ✓ {newsletterMsg}
            </div>
          ) : (
            <form onSubmit={handleNewsletter} style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <input
                type="email"
                placeholder="votre@email.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={newsletterState === 'loading'}
                style={{
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '14px',
                  width: '280px',
                  maxWidth: '100%',
                  outline: 'none',
                  opacity: newsletterState === 'loading' ? 0.7 : 1,
                }}
              />
              <button
                type="submit"
                disabled={newsletterState === 'loading'}
                style={{
                  padding: '12px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: newsletterState === 'loading' ? '#555' : '#1A1A1A',
                  color: '#FFF',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: newsletterState === 'loading' ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: 'inherit',
                  transition: 'background-color 200ms ease',
                }}
              >
                {newsletterState === 'loading' ? 'Inscription…' : 'Je m\'inscris'}
              </button>
            </form>
          )}

          {newsletterState === 'error' && (
            <p style={{ fontSize: '13px', color: 'rgba(255,200,200,0.9)', margin: '10px 0 0' }}>
              {newsletterMsg}
            </p>
          )}

          <p style={{ fontSize: '12px', opacity: 0.6, margin: '14px 0 0' }}>
            Pas de spam. Désabonnement en 1 clic.
          </p>
        </motion.div>

      </div>
    </div>
  )
}
