'use client'

import { colors, componentStyles } from '@/lib/design-tokens'

type BadgeVariant = 'pending' | 'accepted' | 'refused' | 'new' | 'info' | 'success' | 'warning' | 'danger'

interface NexBadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  dot?: boolean
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  pending:  colors.status.pending.dot,
  accepted: colors.status.accepted.dot,
  refused:  colors.status.refused.dot,
  new:      colors.status.new.dot,
  info:     colors.feedback.info.solid,
  success:  colors.feedback.success.solid,
  warning:  colors.feedback.warning.solid,
  danger:   colors.feedback.danger.solid,
}

export function NexBadge({ variant, children, dot = true }: NexBadgeProps) {
  return (
    <span style={{ ...componentStyles.badge.base, ...componentStyles.badge[variant] }}>
      {dot && (
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          backgroundColor: DOT_COLORS[variant], flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  )
}
