'use client'

import { useState } from 'react'
import { colors, componentStyles } from '@/lib/design-tokens'

type InputState = 'idle' | 'error' | 'success'

interface NexInputProps {
  label?: string
  hint?: string
  state?: InputState
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  type?: string
  name?: string
  id?: string
  required?: boolean
  style?: React.CSSProperties
}

export function NexInput({
  label, hint, state = 'idle', placeholder, value, onChange,
  disabled = false, type = 'text', name, id, required, style,
}: NexInputProps) {
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)

  const borderColor = () => {
    if (disabled)             return colors.border.default
    if (state === 'error')    return colors.border.danger
    if (state === 'success')  return colors.border.success
    if (focused)              return colors.border.accent
    if (hovered)              return colors.border.strong
    return colors.border.default
  }

  const boxShadow = () => {
    if (!focused)             return 'none'
    if (state === 'error')    return `0 0 0 3px rgba(224, 90, 90, 0.2)`
    if (state === 'success')  return `0 0 0 3px rgba(76, 175, 80, 0.15)`
    return `0 0 0 3px ${colors.violet.ring}`
  }

  const hintColor = () => {
    if (state === 'error')    return colors.feedback.danger.text
    if (state === 'success')  return colors.feedback.success.text
    return colors.text.secondary
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label htmlFor={id || name} style={componentStyles.input.label}>
          {label}
          {required && <span style={{ color: colors.feedback.danger.solid, marginLeft: '2px' }}>*</span>}
        </label>
      )}
      <input
        id={id || name} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{
          ...componentStyles.input.base,
          borderColor: borderColor(),
          boxShadow: boxShadow(),
          ...(disabled ? componentStyles.input.disabled : {}),
          ...style,
        }}
      />
      {hint && (
        <span style={{ ...componentStyles.input.hint, color: hintColor() }}>{hint}</span>
      )}
    </div>
  )
}
