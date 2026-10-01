import { ImageResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { colors } from '@/lib/design-tokens'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = (searchParams.get('name') || 'Créateur').slice(0, 60)
  const city = (searchParams.get('city') || '').slice(0, 40)
  const avatar = searchParams.get('avatar') || ''
  const disciplines = (searchParams.get('disciplines') || '')
    .split(',')
    .map(d => d.trim())
    .filter(Boolean)
    .slice(0, 3)

  const initial = name.charAt(0).toUpperCase()

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 64px',
          background: `linear-gradient(135deg, ${colors.dark.soft} 0%, ${colors.dark.deep} 50%, ${colors.dark.mid} 100%)`,
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: colors.violet.primary }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: colors.violet.primary }} />
          <span style={{ color: colors.violet.hover, fontSize: '18px', fontWeight: 600, letterSpacing: '0.05em' }}>NEXART</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} width={220} height={220} alt="" style={{ width: '220px', height: '220px', borderRadius: '110px', objectFit: 'cover', border: `4px solid ${colors.violet.primary}` }} />
          ) : (
            <div style={{ width: '220px', height: '220px', borderRadius: '110px', background: colors.violet.primary, color: colors.text.white, fontSize: '96px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {initial}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
            <div style={{ color: colors.text.white, fontSize: name.length > 28 ? '48px' : '64px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {name}
            </div>
            {city ? (
              <div style={{ color: colors.gray.soft, fontSize: '26px', fontWeight: 500 }}>{city}</div>
            ) : null}
            {disciplines.length > 0 ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                {disciplines.map(d => (
                  <div key={d} style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '20px', padding: '6px 16px', color: colors.violet.hover, fontSize: '18px', fontWeight: 600 }}>
                    {d}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: colors.gray.slate, fontSize: '16px' }}>nexart.fr</span>
          <div style={{ background: colors.violet.primary, borderRadius: '12px', padding: '12px 24px', color: colors.text.white, fontSize: '16px', fontWeight: 700 }}>
            Voir le profil
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
