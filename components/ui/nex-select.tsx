'use client'

import { useState } from 'react'
import { colors, componentStyles, radius, typography, transitions } from '@/lib/design-tokens'

interface SelectOption {
  value: string
  label: string
}

interface NexSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  label?: string
  error?: string
  id?: string
  style?: React.CSSProperties
}

export function NexSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  label,
  error,
  id,
  style,
}: NexSelectProps) {
  const [focused, setFocused] = useState(false)

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 36px 9px 12px',
    borderRadius: radius.sm,
    fontSize: typography.small.fontSize,
    fontFamily: typography.fontFamily,
    border: `1.5px solid ${error ? colors.border.danger : focused ? colors.border.accent : colors.border.default}`,
    backgroundColor: disabled ? colors.bg.secondary : colors.bg.primary,
    color: value ? colors.text.primary : colors.text.muted,
    outline: 'none',
    transition: transitions.fast,
    cursor: disabled ? 'not-allowed' : 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    boxShadow: focused
      ? error
        ? `0 0 0 3px rgba(220,38,38,0.15)`
        : `0 0 0 3px rgba(99,102,241,0.15)`
      : 'none',
    ...style,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          htmlFor={id}
          style={{ ...componentStyles.input.label, color: error ? colors.feedback.danger.solid : colors.text.secondary }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={selectStyle}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <span style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: disabled ? colors.text.muted : colors.text.secondary,
          display: 'flex',
          alignItems: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {error && (
        <p style={{ fontSize: '12px', color: colors.feedback.danger.solid, margin: 0 }}>
          {error}
        </p>
      )}
    </div>
  )
}
