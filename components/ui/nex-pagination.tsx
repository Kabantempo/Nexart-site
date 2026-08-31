'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { colors } from '@/lib/design-tokens'

// ── Mode "Voir plus" ─────────────────────────────────────────────────────────
interface LoadMoreProps {
  variant: 'load-more'
  hasMore: boolean
  loading?: boolean
  loaded: number
  total?: number
  onLoadMore: () => void
  label?: string
}

// ── Mode "Pages numérotées" ──────────────────────────────────────────────────
interface PagesProps {
  variant: 'pages'
  page: number
  totalPages: number
  total?: number
  onPage: (p: number) => void
  label?: string
}

type NexPaginationProps = LoadMoreProps | PagesProps

// Génère la liste de numéros à afficher (avec ellipses)
function pageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

export function NexPagination(props: NexPaginationProps) {
  if (props.variant === 'load-more') {
    const { hasMore, loading, loaded, total, onLoadMore, label } = props
    if (!hasMore && (!total || loaded < total)) return null
    const pct = total ? Math.round((loaded / total) * 100) : 0

    return (
      <div style={{ textAlign: 'center', paddingTop: 24 }}>
        {total && (
          <div style={{ maxWidth: 200, margin: '0 auto 12px' }}>
            <div style={{ height: 3, backgroundColor: colors.bg.subtle, borderRadius: 9999, overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', width: `${pct}%`, backgroundColor: colors.violet.primary, borderRadius: 9999, transition: 'width 0.4s ease' }} />
            </div>
            <p style={{ fontSize: 11, color: colors.text.muted, fontWeight: 500 }}>
              {loaded} / {total} {label ?? 'éléments'}
            </p>
          </div>
        )}
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={loading}
            style={{
              padding: '10px 28px', borderRadius: 12,
              border: `2px solid ${colors.violet.primary}`,
              backgroundColor: 'transparent', color: colors.violet.primary,
              fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'background-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = colors.violet.primary
                ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
              ;(e.currentTarget as HTMLButtonElement).style.color = colors.violet.primary
            }}
          >
            {loading ? 'Chargement…' : total
              ? `Voir ${Math.min(total - loaded, 12)} de plus`
              : 'Voir plus'}
          </button>
        )}
        {!hasMore && total && loaded >= total && (
          <p style={{ fontSize: 12, color: colors.text.muted, marginTop: 8 }}>
            Tous les {total} {label ?? 'éléments'} sont affichés
          </p>
        )}
      </div>
    )
  }

  // ── Pages numérotées ────────────────────────────────────────────────────────
  const { page, totalPages, total, onPage, label } = props
  if (totalPages <= 1) return null

  const nums = pageNumbers(page, totalPages)

  const btnBase: React.CSSProperties = {
    minWidth: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, border: `1px solid ${colors.border.default}`,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
    backgroundColor: colors.bg.primary, color: colors.text.primary,
  }
  const btnActive: React.CSSProperties = {
    ...btnBase, backgroundColor: colors.violet.primary,
    color: colors.text.white, borderColor: colors.violet.primary,
  }
  const btnDisabled: React.CSSProperties = {
    ...btnBase, backgroundColor: colors.bg.secondary,
    color: colors.text.muted, cursor: 'not-allowed',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingTop: 16 }}>
      {total != null ? (
        <span style={{ fontSize: 13, color: colors.text.secondary }}>
          Page {page}/{totalPages} · {total.toLocaleString('fr-FR')} {label ?? 'entrées'}
        </span>
      ) : <span />}

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {/* ← */}
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          style={page === 1 ? btnDisabled : btnBase}
          aria-label="Page précédente"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Numéros */}
        {nums.map((n, i) =>
          n === '…' ? (
            <span key={`ellipsis-${i}`} style={{ padding: '0 4px', color: colors.text.muted, fontSize: 13 }}>…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n as number)}
              style={n === page ? btnActive : btnBase}
              aria-current={n === page ? 'page' : undefined}
            >
              {n}
            </button>
          )
        )}

        {/* → */}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          style={page === totalPages ? btnDisabled : btnBase}
          aria-label="Page suivante"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
