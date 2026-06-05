'use client'

import React from 'react'

export function GridCard({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        transition: 'all 300ms ease',
        cursor: 'pointer',
        ...((props as any).style || {}),
      }}
      {...props}
    >
      {children}
    </div>
  )
}
