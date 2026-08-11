'use client'

import { useRef } from 'react'

export interface NexTab<T extends string = string> {
  key: T
  label: string
  icon?: React.ReactNode
  badge?: number | string
}

interface NexTabsProps<T extends string = string> {
  tabs: NexTab<T>[]
  activeTab: T
  onChange: (key: T) => void
  /** Visual style (default: 'pill') */
  variant?: 'pill' | 'underline'
  /** Size preset (default: 'md') */
  size?: 'sm' | 'md'
  /** aria-label for the tablist */
  ariaLabel?: string
}

export function NexTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'pill',
  size = 'md',
  ariaLabel = 'Navigation par onglets',
}: NexTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)

  const fontSize = size === 'sm' ? '12px' : '13px'
  const padding = size === 'sm' ? '5px 12px' : '7px 16px'

  // Keyboard navigation (arrow keys)
  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    if (!buttons) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = (idx + 1) % tabs.length
      buttons[next].focus()
      onChange(tabs[next].key)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = (idx - 1 + tabs.length) % tabs.length
      buttons[prev].focus()
      onChange(tabs[prev].key)
    }
  }

  if (variant === 'underline') {
    return (
      <div
        ref={listRef}
        role="tablist"
        aria-label={ariaLabel}
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid var(--border-color)',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab, idx) => {
          const isActive = tab.key === activeTab
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.key)}
              onKeyDown={e => onKeyDown(e, idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: size === 'sm' ? '8px 14px' : '10px 18px',
                fontSize,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#6366F1' : 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid #6366F1' : '2px solid transparent',
                marginBottom: '-1px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
              {tab.label}
              {tab.badge !== undefined && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '18px',
                  height: '18px',
                  padding: '0 5px',
                  borderRadius: '9px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: isActive ? '#6366F1' : 'var(--bg-secondary)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // Default: pill variant
  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      style={{
        display: 'flex',
        gap: '2px',
        backgroundColor: 'var(--bg-secondary)',
        padding: '4px',
        borderRadius: '10px',
        width: 'fit-content',
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={e => onKeyDown(e, idx)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding,
              borderRadius: '7px',
              fontSize,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              backgroundColor: isActive ? '#fff' : 'transparent',
              color: isActive ? '#6366F1' : 'var(--text-secondary)',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '18px',
                height: '18px',
                padding: '0 5px',
                borderRadius: '9px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: isActive ? '#6366F1' : 'var(--border-color)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
