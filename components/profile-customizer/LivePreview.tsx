'use client'
import { useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import { FONT_FAMILIES, type PageSettings } from '@/lib/page-settings'
import { colors } from '@/lib/design-tokens'

interface Props {
  settings: PageSettings
  creatorName: string
  avatarUrl?: string
  bio?: string
}

type ViewMode = 'desktop' | 'mobile'

export function LivePreview({ settings, creatorName, avatarUrl, bio }: Props) {
  const [mode, setMode] = useState<ViewMode>('desktop')

  const bg = settings.bg_color ?? '#0D0D0D'
  const accent = settings.accent_color ?? '#6366F1'
  const textColor = settings.bio_color ?? '#F5F3EF'
  const fontFamily = FONT_FAMILIES[settings.bio_font ?? 'default']
  const cover = settings.cover_image

  const isMobile = mode === 'mobile'

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
          Aperçu en direct
        </p>
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', padding: '3px' }}>
          {(['desktop', 'mobile'] as ViewMode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, backgroundColor: mode === m ? colors.violet.primary : 'transparent', color: mode === m ? '#fff' : colors.text.muted, transition: 'all 0.15s' }}>
              {m === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />}
              {m === 'desktop' ? 'PC' : 'Mobile'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview frame */}
      <div style={{ width: '100%', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${colors.border.default}`, backgroundColor: bg }}>
        {/* Browser chrome */}
        <div style={{ backgroundColor: 'var(--bg-tertiary)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: `1px solid ${colors.border.default}` }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF5F57', display: 'inline-block' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFBD2E', display: 'inline-block' }} />
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#28CA41', display: 'inline-block' }} />
          <div style={{ flex: 1, marginLeft: '8px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', color: colors.text.muted }}>
            nexart.fr/creators/{creatorName?.toLowerCase().replace(/\s+/g, '-') || '...'}
          </div>
          {isMobile && <Smartphone size={12} color={colors.text.muted} />}
        </div>

        {/* Page — pleine largeur, hauteur fixe */}
        <div style={{ backgroundColor: bg, height: isMobile ? '480px' : '340px', fontFamily, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Hero */}
          <div style={{ backgroundColor: bg, position: 'relative', height: isMobile ? '200px' : '140px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '14px' }}>
            {cover ? (
              <img src={cover} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, objectPosition: `center ${settings.cover_position_y ?? 50}%` }} />
            ) : (
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${accent}33, ${bg})` }} />
            )}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: isMobile ? '56px' : '52px', height: isMobile ? '56px' : '52px', borderRadius: '50%', border: `2px solid ${accent}`, overflow: 'hidden', backgroundColor: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {avatarUrl
                  ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{creatorName?.[0]?.toUpperCase()}</span>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: isMobile ? '15px' : '14px', fontWeight: 800, color: textColor, margin: '0 0 2px', fontFamily }}>{creatorName || 'Votre nom'}</p>
                {settings.tagline && <p style={{ fontSize: '11px', color: accent, margin: 0, fontWeight: 600 }}>{settings.tagline}</p>}
              </div>
            </div>
          </div>

          {/* Body — 3 colonnes (PC) */}
          <div style={{ padding: isMobile ? '12px' : '12px 16px', display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row', flex: 1, minHeight: 0, alignItems: 'stretch' }}>

            {/* Gauche */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {bio && (
                <p style={{ fontSize: '9px', color: `${textColor}bb`, fontFamily, lineHeight: 1.5, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>
                  {bio}
                </p>
              )}
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                {['Céramique', 'Illustration'].map(d => (
                  <div key={d} style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: `${textColor}10`, border: `1px solid ${textColor}20`, fontSize: '8px', color: `${textColor}80` }}>{d}</div>
                ))}
              </div>
            </div>

            {/* Centre : portfolio */}
            <div style={{ flex: 3, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', backgroundColor: `${accent}08`, border: `1px solid ${accent}20`, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '4px', padding: '6px' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ borderRadius: '4px', backgroundColor: `${accent}${i % 2 === 0 ? '25' : '18'}` }} />
                ))}
              </div>
            </div>

            {/* Droite : sidebar */}
            {!isMobile && (
              <div style={{ flex: 1.4, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1, border: `2px solid ${accent}55`, borderRadius: '10px', padding: '10px', backgroundColor: `${accent}08`, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                    {['Marchés', 'Créations'].map(l => (
                      <div key={l} style={{ textAlign: 'center', padding: '6px 4px', backgroundColor: `${accent}10`, borderRadius: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: textColor }}>0</div>
                        <div style={{ fontSize: '7px', color: `${textColor}60`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: '22px', backgroundColor: accent, borderRadius: '6px', opacity: 0.9, flexShrink: 0 }} />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      <p style={{ fontSize: '11px', color: colors.text.muted, marginTop: '8px', textAlign: 'center' }}>
        Sauvegarde pour appliquer sur ta page publique
      </p>
    </div>
  )
}
