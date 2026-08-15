import { ImageResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { colors } from '@/lib/design-tokens'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'Événement artisanal'
  const city = searchParams.get('city') || ''
  const date = searchParams.get('date') || ''
  const type = searchParams.get('type') || 'Marché artisanal'

  const dateLabel = date
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
    : ''

  const locationLabel = city ? `📍 ${city}` : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle top border accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: colors.violet.primary,
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-80px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 70%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            padding: '56px 64px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: colors.violet.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              ✦
            </div>
            <span style={{ color: colors.violet.hover, fontSize: '18px', fontWeight: 600, letterSpacing: '0.05em' }}>
              NEXART
            </span>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
            {/* Type badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  background: 'rgba(99,102,241,0.2)',
                  border: '1px solid rgba(99,102,241,0.4)',
                  borderRadius: '20px',
                  padding: '6px 16px',
                  color: colors.violet.hover,
                  fontSize: '14px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {type}
              </div>
            </div>

            {/* Title */}
            <div
              style={{
                color: colors.bg.primary,
                fontSize: title.length > 40 ? '42px' : title.length > 25 ? '52px' : '60px',
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {dateLabel ? (
                <span style={{ color: '#94A3B8', fontSize: '20px', fontWeight: 500 }}>
                  🗓 {dateLabel}
                </span>
              ) : null}
              {locationLabel ? (
                <span style={{ color: '#94A3B8', fontSize: '20px', fontWeight: 500 }}>
                  {locationLabel}
                </span>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#475569', fontSize: '16px' }}>nexart.fr</span>
            <div
              style={{
                background: colors.violet.primary,
                borderRadius: '12px',
                padding: '12px 24px',
                color: colors.bg.primary,
                fontSize: '16px',
                fontWeight: 700,
              }}
            >
              Candidater →
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
