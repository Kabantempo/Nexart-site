'use client'
import { FONT_FAMILIES, type PortfolioBlock } from '@/lib/page-settings'

interface Props {
  blocks: PortfolioBlock[]
}

// Même constantes que le PortfolioBoard éditeur — référentiel identique
const BOARD_W = 900
const BOARD_H = 700

export function PortfolioBoardStatic({ blocks }: Props) {
  if (!blocks.length) return null

  return (
    // Canvas 900×700 centré — Y=0 = haut du hero, même que le board éditeur
    <div style={{ position: 'relative', width: '100%', height: `${BOARD_H}px` }}>
      {blocks.map(block => {
        const leftPct = block.x
        const topPx = (block.y / 100) * BOARD_H  // Y brut, même calc que l'éditeur
        const wPct = block.width
        const hPx = (block.height / 100) * BOARD_H

        return (
          <div key={block.id}
            style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPx}px`,
              width: `${wPct}%`,
              height: `${hPx}px`,
              transform: block.rotation ? `rotate(${block.rotation}deg)` : undefined,
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {block.type === 'image' ? (
              <img src={block.content} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy" />
            ) : (
              <div style={{
                width: '100%', height: '100%', padding: '8px', wordBreak: 'break-word',
                fontFamily: FONT_FAMILIES[block.font ?? 'default'],
                fontSize: `clamp(12px, ${block.fontSize ?? 16}px, ${(block.fontSize ?? 16) * 1.5}px)`,
                color: '#fff', lineHeight: 1.4,
                backgroundColor: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
              }}>
                {block.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
