'use client'

import { useState } from 'react'
import { colors, componentStyles, radius, typography } from '@/lib/design-tokens'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize    = 'sm' | 'md' | 'lg'

interface NexButtonProps {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  style?: React.CSSProperties
}

export function NexButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  style,
}: NexButtonProps) {
  const [hovered, setHovered] = useState(false)

  const sizeStyles = {
    sm: componentStyles.button.sm,
    md: {},
    lg: componentStyles.button.lg,
  }

  const variantBase: Record<ButtonVariant, React.CSSProperties> = {
    primary:   componentStyles.button.primary,
    secondary: componentStyles.button.secondary,
    ghost:     componentStyles.button.ghost,
    danger:    componentStyles.button.danger,
  }

  const variantHover: Record<ButtonVariant, React.CSSProperties> = {
    primary:   componentStyles.button.primaryHover,
    secondary: componentStyles.button.secondaryHover,
    ghost:     componentStyles.button.ghostHover,
    danger:    componentStyles.button.dangerHover,
  }

  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={() => !isDisabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...componentStyles.button.base,
        ...variantBase[variant],
        ...(hovered ? variantHover[variant] : {}),
        ...(isDisabled ? componentStyles.button.disabled : {}),
        ...sizeStyles[size],
        ...style,
      }}
    >
      {loading && (
        <span style={{
          width: '14px',
          height: '14px',
          border: `2px solid ${variant === 'primary' ? 'rgba(255,255,255,0.3)' : 'rgba(99,102,241,0.3)'}`,
          borderTopColor: variant === 'primary' ? '#fff' : colors.violet.primary,
          borderRadius: radius.pill,
          animation: 'nexart-spin 0.7s linear infinite',
          display: 'inline-block',
          flexShrink: 0,
        }} />
      )}
      {children}
      <style>{`@keyframes nexart-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
