'use client'

import * as React from 'react'
import { motion } from 'framer-motion'

interface GridItem {
  name: string
  title: string
  image: string
  avatar: string
  size?: 'small' | 'medium' | 'large'
}

interface ImageTestimonialGridProps extends React.HTMLAttributes<HTMLDivElement> {
  items: GridItem[]
  columns?: number
}

const getGridSize = (size?: string) => {
  switch (size) {
    case 'large':
      return { gridColumn: 'span 2', gridRow: 'span 2', height: '400px' }
    case 'medium':
      return { gridColumn: 'span 1', gridRow: 'span 2', height: '400px' }
    case 'small':
    default:
      return { gridColumn: 'span 1', gridRow: 'span 1', height: '300px' }
  }
}

export function ImageTestimonialGrid({
  items,
  columns = 3,
  className,
  ...props
}: ImageTestimonialGridProps) {
  const [gridColumns, setGridColumns] = React.useState(columns)

  React.useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        const width = window.innerWidth
        if (width < 640) setGridColumns(1)
        else if (width < 1024) setGridColumns(2)
        else setGridColumns(3)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        gap: '16px',
        width: '100%',
      }}
      className={className}
      {...props}
    >
      {items.map((item, idx) => {
        const sizeStyle = getGridSize(item.size)
        return (
          <motion.div
            key={idx}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            style={{
              ...sizeStyle,
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 300ms ease',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            }}
          >
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&fit=crop'
              }}
            />

            {/* Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                zIndex: 1,
              }}
            />

            {/* Content */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                color: '#FFFFFF',
                zIndex: 2,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <img
                  src={item.avatar}
                  alt={item.name}
                  loading="lazy"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid #FFFFFF',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150?img=0'
                  }}
                />
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', margin: 0, lineHeight: '1.2' }}>
                    {item.name}
                  </p>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.8)',
                      margin: 0,
                      lineHeight: '1.2',
                    }}
                  >
                    {item.title}
                  </p>
                </div>
              </div>
              <button
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(99, 102, 241, 0.9)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 300ms ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6366F1'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(99, 102, 241, 0.9)'
                }}
              >
                Voir le profil
              </button>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
