import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const title = searchParams.get('title') || 'Nexart'
  const subtitle = searchParams.get('subtitle') || 'La plateforme des créateurs artisanaux'
  const type = searchParams.get('type') || 'default' // 'event' | 'creator' | 'default'

  const accentColor = type === 'creator' ? '#818CF8' : '#6366F1'
  const emoji = type === 'event' ? '📅' : type === 'creator' ? '🎨' : '✨'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0F0C29 0%, #1E1B4B 50%, #2D1B69 100%)',
          padding: '60px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 800, color: '#fff',
          }}>N</div>
          <span style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF' }}>Nexart</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            background: 'rgba(99,102,241,0.2)', borderRadius: '999px',
            padding: '8px 20px', width: 'fit-content', marginBottom: '24px',
          }}>
            <span style={{ fontSize: '20px' }}>{emoji}</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#A5B4FC', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {type === 'event' ? 'Événement' : type === 'creator' ? 'Créateur' : 'Nexart'}
            </span>
          </div>

          <div style={{
            fontSize: title.length > 40 ? '40px' : '52px',
            fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15,
            marginBottom: '20px',
            maxWidth: '900px',
          }}>
            {title}
          </div>

          {subtitle && (
            <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.6)', maxWidth: '800px' }}>
              {subtitle}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px',
        }}>
          <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>nexart.fr</span>
          <div style={{
            padding: '10px 24px', borderRadius: '8px',
            background: accentColor,
            fontSize: '16px', fontWeight: 700, color: '#fff',
          }}>
            Découvrir →
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
