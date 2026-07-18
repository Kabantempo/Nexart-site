'use client'

import { componentStyles } from '@/lib/design-tokens'

type AlertVariant = 'danger' | 'success' | 'warning' | 'info'

interface NexAlertProps {
  variant: AlertVariant
  children: React.ReactNode
}

const ALERT_ICONS: Record<AlertVariant, string> = {
  danger: '✕', success: '✓', warning: '⚠', info: 'ℹ',
}

export function NexAlert({ variant, children }: NexAlertProps) {
  return (
    <div style={{ ...componentStyles.alert.base, ...componentStyles.alert[variant] }}>
      <span style={{ fontWeight: 600, flexShrink: 0 }}>{ALERT_ICONS[variant]}</span>
      <span>{children}</span>
    </div>
  )
}
