'use client'

import { componentStyles, spacing } from '@/lib/design-tokens'

interface NexSkeletonProps {
  width?: string
  height?: string
  borderRadius?: string
  style?: React.CSSProperties
}

export function NexSkeleton({ width = '100%', height = '14px', borderRadius = '6px', style }: NexSkeletonProps) {
  return (
    <>
      <div style={{
        width, height, borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '400% 100%',
        animation: 'nexart-shimmer 1.4s infinite linear',
        ...style,
      }} />
      <style>{`@keyframes nexart-shimmer { 0% { background-position: 100% 0; } 100% { background-position: -100% 0; } }`}</style>
    </>
  )
}

export function NexSkeletonCard() {
  return (
    <div style={{ ...componentStyles.card.base, display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        <NexSkeleton width="44px" height="44px" borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <NexSkeleton width="60%" height="14px" />
          <NexSkeleton width="40%" height="12px" />
        </div>
      </div>
      <NexSkeleton height="12px" />
      <NexSkeleton width="85%" height="12px" />
      <NexSkeleton width="70%" height="12px" />
    </div>
  )
}
