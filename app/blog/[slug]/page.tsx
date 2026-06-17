import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ARTICLES } from '@/lib/blog-data'
import { Clock, ArrowLeft, Tag, Calendar } from 'lucide-react'

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) return { title: 'Article non trouvé' }
  return {
    title: `${article.title} | Blog Nexart`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
      url: `https://nexart.fr/blog/${article.slug}`,
      images: article.image ? [{ url: article.image, width: 1200, height: 630 }] : [],
    },
  }
}

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
  'créateurs':     { color: '#6366F1', bg: '#EEF2FF' },
  'organisateurs': { color: '#06B6D4', bg: '#ECFEFF' },
  'actualités':    { color: '#10B981', bg: '#ECFDF5' },
}

export default async function BlogArticlePage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const article = ARTICLES.find((a) => a.slug === slug)
  if (!article) notFound()

  const dateStr = new Date(article.date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const currentIndex = ARTICLES.findIndex((a) => a.slug === slug)
  const prev = currentIndex > 0 ? ARTICLES[currentIndex - 1] : null
  const next = currentIndex < ARTICLES.length - 1 ? ARTICLES[currentIndex + 1] : null

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: 'calc(100vh - 200px)' }}>
      {/* Hero */}
      <div style={{ background: article.gradient, padding: '60px 16px 48px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <Link
            href="/blog"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
              fontSize: '14px', fontWeight: '600', marginBottom: '32px',
            }}
          >
            <ArrowLeft size={16} />
            Retour au blog
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '11px', fontWeight: '700', padding: '3px 12px', borderRadius: '20px',
              backgroundColor: 'rgba(255,255,255,0.25)', color: '#FFF',
              backdropFilter: 'blur(4px)', textTransform: 'capitalize',
            }}>
              {article.category}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              <Clock size={13} /> {article.readTime} min de lecture
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>
              <Calendar size={13} /> {dateStr}
            </span>
          </div>

          <div style={{ fontSize: '64px', marginBottom: '16px' }}>{article.icon}</div>

          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#FFF', lineHeight: '1.2', marginBottom: '16px' }}>
            {article.title}
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6' }}>
            {article.excerpt}
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '24px' }}>
            {article.tags.map((tag) => (
              <span key={tag} style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '12px', fontWeight: '600', padding: '4px 12px',
                borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.2)',
                color: '#FFF', backdropFilter: 'blur(4px)',
              }}>
                <Tag size={10} />{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Article content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 16px 80px' }}>
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Navigation prev/next */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: prev && next ? '1fr 1fr' : '1fr',
          gap: '16px', marginTop: '64px', paddingTop: '40px',
          borderTop: '1px solid #E5E7EB',
        }}>
          {prev && (
            <Link href={`/blog/${prev.slug}`} className="blog-nav-link">
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ← Article précédent
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', lineHeight: '1.4' }}>
                {prev.title}
              </span>
            </Link>
          )}
          {next && (
            <Link href={`/blog/${next.slug}`} className="blog-nav-link" style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Article suivant →
              </span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1A1A1A', lineHeight: '1.4' }}>
                {next.title}
              </span>
            </Link>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link
            href="/blog"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '12px 24px', borderRadius: '10px',
              backgroundColor: '#6366F1', color: '#FFF',
              textDecoration: 'none', fontSize: '14px', fontWeight: '600',
            }}
          >
            <ArrowLeft size={14} />
            Tous les articles
          </Link>
        </div>
      </div>
    </div>
  )
}
