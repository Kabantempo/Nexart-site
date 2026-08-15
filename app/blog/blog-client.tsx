'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ARTICLES, type Article } from '@/lib/blog-data'
import { colors } from '@/lib/design-tokens'

type Category = 'tous' | 'créateurs' | 'organisateurs' | 'actualités'

const CATEGORY_LABELS: Record<Category, string> = {
  tous: 'Tous',
  créateurs: 'Créateurs',
  organisateurs: 'Organisateurs',
  actualités: 'Actualités',
}

const CATEGORY_COLORS: Record<Exclude<Category, 'tous'>, { bg: string; text: string }> = {
  créateurs: { bg: 'rgba(99,102,241,0.1)', text: colors.violet.primary },
  organisateurs: { bg: 'rgba(16,185,129,0.1)', text: colors.feedback.success.solid },
  actualités: { bg: 'rgba(245,158,11,0.1)', text: colors.feedback.warning.solid },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function ArticleCard({ article, index }: { article: Article; index: number }) {
  const catColor = CATEGORY_COLORS[article.category] ?? { bg: 'rgba(99,102,241,0.1)', text: colors.violet.primary }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      style={{
        backgroundColor: colors.bg.primary,
        borderRadius: '16px',
        border: `1px solid ${colors.border.default}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 200ms ease',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Icon header */}
      <div style={{
        height: '120px',
        background: article.gradient ?? 'linear-gradient(135deg, ${colors.violet.primary} 0%, ${colors.purple.primary} 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
      }}>
        {article.icon}
      </div>

      {/* Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        {/* Category + readTime */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: catColor.bg,
            color: catColor.text,
          }}>
            {article.category.charAt(0).toUpperCase() + article.category.slice(1)}
          </span>
          <span style={{ fontSize: '12px', color: colors.text.muted }}>
            {article.readTime} min de lecture
          </span>
        </div>

        {/* Title */}
        <h2 style={{
          fontSize: '16px',
          fontWeight: '700',
          color: colors.text.primary,
          lineHeight: '1.4',
          margin: 0,
        }}>
          {article.title}
        </h2>

        {/* Excerpt */}
        <p style={{
          fontSize: '14px',
          color: colors.text.secondary,
          lineHeight: '1.6',
          margin: 0,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } as React.CSSProperties}>
          {article.excerpt}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(article.tags ?? []).slice(0, 3).map((tag) => (
            <span key={tag} style={{
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '500',
              backgroundColor: colors.bg.subtle,
              color: colors.text.secondary,
            }}>
              #{tag}
            </span>
          ))}
        </div>

        {/* Date */}
        <p style={{ fontSize: '12px', color: colors.text.muted, margin: 0 }}>
          {formatDate(article.date)}
        </p>
      </div>
    </motion.div>
  )
}

export default function BlogClient() {
  const [activeCategory, setActiveCategory] = useState<Category>('tous')

  const filtered = activeCategory === 'tous'
    ? ARTICLES
    : ARTICLES.filter((a) => a.category === activeCategory)

  const categories: Category[] = ['tous', 'créateurs', 'organisateurs', 'actualités']

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: 'calc(100vh - 80px)' }}>

      {/* Hero */}
      <div style={{ backgroundColor: colors.bg.secondary, borderBottom: `1px solid ${colors.border.default}` }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '60px 16px 48px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: '600',
              backgroundColor: 'rgba(99,102,241,0.1)',
              color: colors.violet.primary,
              marginBottom: '16px',
            }}>
              Blog Nexart
            </span>
            <h1 style={{
              fontSize: '42px',
              fontWeight: '800',
              color: colors.text.primary,
              marginBottom: '16px',
              letterSpacing: '-0.5px',
              lineHeight: '1.2',
            }}>
              Conseils & Actualités
            </h1>
            <p style={{
              fontSize: '18px',
              color: colors.text.secondary,
              maxWidth: '540px',
              lineHeight: '1.6',
              margin: 0,
            }}>
              Guides pratiques, astuces et actualités pour créateurs artisanaux et organisateurs de marchés en France.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters + Grid */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 16px 80px' }}>

        {/* Category filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', flexWrap: 'wrap' }}>
          {categories.map((cat) => {
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  border: active ? `1px solid ${colors.border.accent}` : `1px solid ${colors.border.default}`,
                  backgroundColor: active ? colors.violet.primary : colors.bg.primary,
                  color: active ? colors.bg.primary : colors.text.secondary,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                }}
              >
                {CATEGORY_LABELS[cat]}
                <span style={{
                  marginLeft: '6px',
                  fontSize: '12px',
                  opacity: 0.7,
                }}>
                  {cat === 'tous' ? ARTICLES.length : ARTICLES.filter((a) => a.category === cat).length}
                </span>
              </button>
            )
          })}
        </div>

        {/* Articles grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {filtered.map((article, i) => (
            <ArticleCard key={article.id} article={article} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: colors.text.muted }}>
            <p style={{ fontSize: '16px' }}>Aucun article dans cette catégorie pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
