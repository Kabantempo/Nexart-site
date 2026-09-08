'use client'
import { colors } from '@/lib/design-tokens'
import { SECTION_LABELS, type SectionKey, type PageSettings } from '@/lib/page-settings'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Props {
  order: SectionKey[]
  visible: Partial<Record<SectionKey, boolean>>
  onChange: (patch: Pick<PageSettings, 'sections_order' | 'sections_visible'>) => void
}

export function SectionsToggle({ order, visible, onChange }: Props) {
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order]
    const target = idx + dir
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]]
    onChange({ sections_order: next, sections_visible: visible })
  }

  const toggle = (key: SectionKey) => {
    onChange({ sections_order: order, sections_visible: { ...visible, [key]: !visible[key] } })
  }

  return (
    <div>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Sections visibles
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {order.map((key, idx) => {
          const on = visible[key] !== false
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: `1px solid ${on ? 'transparent' : colors.border.default}` }}>
              {/* Order buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button onClick={() => move(idx, -1)} disabled={idx === 0} style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: '0', lineHeight: 1, opacity: idx === 0 ? 0.3 : 1 }}>
                  <ChevronUp size={13} color={colors.text.muted} />
                </button>
                <button onClick={() => move(idx, 1)} disabled={idx === order.length - 1} style={{ border: 'none', background: 'none', cursor: idx === order.length - 1 ? 'default' : 'pointer', padding: '0', lineHeight: 1, opacity: idx === order.length - 1 ? 0.3 : 1 }}>
                  <ChevronDown size={13} color={colors.text.muted} />
                </button>
              </div>
              {/* Label */}
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: on ? 'var(--text-primary)' : colors.text.muted }}>
                {SECTION_LABELS[key]}
              </span>
              {/* Toggle */}
              <button
                onClick={() => toggle(key)}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  backgroundColor: on ? colors.violet.primary : '#D1D5DB',
                  position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: '2px', left: on ? '18px' : '2px',
                  width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff',
                  transition: 'left 0.2s', display: 'block',
                }} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
