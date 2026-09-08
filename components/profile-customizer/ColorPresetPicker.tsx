'use client'
import { colors } from '@/lib/design-tokens'
import { ACCENT_PRESETS } from '@/lib/page-settings'
import { Check } from 'lucide-react'

interface Props {
  value: string
  onChange: (color: string) => void
}

export function ColorPresetPicker({ value, onChange }: Props) {
  return (
    <div>
      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Couleur accent
      </p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {ACCENT_PRESETS.map(preset => {
          const active = value === preset
          return (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              title={preset}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: preset, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                outline: active ? `3px solid ${preset}` : '3px solid transparent',
                outlineOffset: '2px', transition: 'outline 0.15s',
                flexShrink: 0,
              }}
            >
              {active && <Check size={14} color="#fff" strokeWidth={3} />}
            </button>
          )
        })}
        {/* Custom color */}
        <label title="Couleur personnalisée" style={{ position: 'relative', width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: `2px solid ${colors.border.default}`, flexShrink: 0 }}>
          <div style={{ width: '100%', height: '100%', background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} />
          <input
            type="color"
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
          />
        </label>
      </div>
    </div>
  )
}
