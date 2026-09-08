'use client'
import { colors } from '@/lib/design-tokens'
import { FONT_LABELS, FONT_FAMILIES, type PageSettings } from '@/lib/page-settings'

interface Props {
  value: NonNullable<PageSettings['bio_font']>
  onChange: (font: NonNullable<PageSettings['bio_font']>) => void
}

const FONTS: NonNullable<PageSettings['bio_font']>[] = ['default', 'serif', 'mono']

export function FontPicker({ value, onChange }: Props) {
  return (
    <div>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Police
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {FONTS.map(font => {
          const active = value === font
          return (
            <button
              key={font}
              onClick={() => onChange(font)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: '10px', border: 'none',
                backgroundColor: active ? colors.violet.primary : 'var(--bg-secondary)',
                cursor: 'pointer', transition: 'all 0.15s',
                outline: active ? `2px solid ${colors.violet.primary}` : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: '13px', fontFamily: FONT_FAMILIES[font], color: active ? '#fff' : 'var(--text-primary)', fontWeight: 500 }}>
                {FONT_LABELS[font]}
              </span>
              <span style={{ fontSize: '12px', fontFamily: FONT_FAMILIES[font], color: active ? 'rgba(255,255,255,0.7)' : colors.text.muted }}>
                Aa Bb Cc
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
