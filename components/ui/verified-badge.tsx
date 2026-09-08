export function VerifiedBadge({ size = 16 }: { size?: number }) {
  const iconSize = Math.round(size * 0.58)
  return (
    <span
      title="Créateur vérifié"
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366F1, #818CF8)',
        flexShrink: 0,
      }}
    >
      <svg width={iconSize} height={iconSize} viewBox="0 0 12 12" fill="none">
        <path d="M6 1L7.5 4.5H11L8.5 6.5L9.5 10L6 8L2.5 10L3.5 6.5L1 4.5H4.5L6 1Z" fill="#fff" />
      </svg>
    </span>
  )
}
