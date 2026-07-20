'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChangelogEntry {
  type: string
  text: string
}

interface ChangelogVersion {
  id: string
  version: string
  date: string
  title: string | null
  entries: ChangelogEntry[]
}

const TYPE_META: Record<string, { emoji: string; label: string; color: string }> = {
  new:         { emoji: '✨', label: 'Nouveauté',   color: '#6366F1' },
  improvement: { emoji: '🛠️', label: 'Amélioration', color: '#2196F3' },
  fix:         { emoji: '🐛', label: 'Correctif',   color: '#4CAF50' },
  perf:        { emoji: '⚡', label: 'Performance',  color: '#FF9800' },
  security:    { emoji: '🔒', label: 'Sécurité',    color: 'var(--text-secondary)' },
}

const SEEN_KEY = 'nexart_last_seen_changelog'

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      .format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WhatsNew({ dark = false }: { dark?: boolean }) {
  const [versions, setVersions] = useState<ChangelogVersion[]>([])
  const [open, setOpen] = useState(false)
  const [supported, setSupported] = useState(true)
  const [hasUnseen, setHasUnseen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const latestVersion = versions[0]?.version

  const fetchVersions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('changelog')
        .select('id, version, date, title, entries')
        .eq('published', true)
        .order('date', { ascending: false })
        .limit(20)

      if (error?.code === '42P01') { setSupported(false); return }
      if (error) return
      setVersions((data as unknown as ChangelogVersion[]) || [])
    } catch {
      setSupported(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => { fetchVersions() }, [fetchVersions])

  // Compute unseen state once versions are loaded (localStorage read client-side only)
  useEffect(() => {
    if (!latestVersion) return
    const seen = typeof window !== 'undefined' ? window.localStorage.getItem(SEEN_KEY) : null
    setHasUnseen(seen !== latestVersion)
  }, [latestVersion])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && latestVersion) {
      window.localStorage.setItem(SEEN_KEY, latestVersion)
      setHasUnseen(false)
    }
  }

  if (!supported || versions.length === 0) return null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Button */}
      <button
        onClick={toggle}
        title="Nouveautés"
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors relative ${dark ? 'text-white/70 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
      >
        <Sparkles size={16} />
        {hasUnseen && (
          <span style={{
            position: 'absolute', top: '-2px', right: '-2px',
            width: '9px', height: '9px', borderRadius: '9999px',
            backgroundColor: '#6366F1', border: '2px solid var(--bg-primary)',
          }} />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0,
              width: '360px', maxWidth: '90vw',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              zIndex: 9999,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)' }}>
              <Sparkles size={16} color="#6366F1" />
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Nouveautés</span>
            </div>

            {/* Versions list */}
            <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {versions.map(v => (
                <div key={v.id} style={{ padding: '16px 18px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '10px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: 700, color: '#6366F1',
                      backgroundColor: '#EEF2FF', borderRadius: '6px', padding: '2px 7px',
                    }}>
                      v{v.version}
                    </span>
                    {v.title && (
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{v.title}</span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {formatDate(v.date)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(v.entries || []).map((e, i) => {
                      const meta = TYPE_META[e.type] ?? TYPE_META.new
                      return (
                        <div key={i} style={{ display: 'flex', gap: '9px', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '14px', lineHeight: 1.4, flexShrink: 0 }} title={meta.label}>
                            {meta.emoji}
                          </span>
                          <span style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {e.text}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
