export type SectionKey = 'portfolio' | 'reviews' | 'availability' | 'badges'

export type PortfolioBlock = {
  id: string
  type: 'image' | 'text'
  content: string
  x: number        // % du conteneur
  y: number
  width: number    // % du conteneur
  height: number
  rotation?: number
  font?: 'default' | 'serif' | 'mono'
  fontSize?: number
}

export type PageSettings = {
  // Existant mobile — ne pas renommer
  bio_font?: 'default' | 'serif' | 'mono'
  bg_color?: string
  accent_color?: string
  bio_color?: string
  tagline?: string
  music_url?: string
  music_label?: string
  // Nouveau web
  cover_image?: string
  cover_position_y?: number  // 0-100, position verticale de la bannière
  sections_order?: SectionKey[]
  sections_visible?: Partial<Record<SectionKey, boolean>>
  social_style?: 'chip' | 'underline' | 'icon-only'
  portfolio_blocks?: PortfolioBlock[]
}

export const DEFAULT_PAGE_SETTINGS: Required<Pick<PageSettings, 'bg_color' | 'accent_color' | 'bio_color'>> & PageSettings = {
  bg_color: '#0D0D0D',
  accent_color: '#6366F1',
  bio_color: '#F5F3EF',
  bio_font: 'default',
  sections_order: ['portfolio', 'reviews', 'availability', 'badges'],
  sections_visible: { portfolio: true, reviews: true, availability: true, badges: true },
  social_style: 'chip',
  portfolio_blocks: [],
}

export function mergePageSettings(
  saved: Partial<PageSettings> | null | undefined,
  defaults: typeof DEFAULT_PAGE_SETTINGS = DEFAULT_PAGE_SETTINGS
): PageSettings {
  if (!saved) return { ...defaults }
  return {
    ...defaults,
    ...saved,
    sections_visible: { ...defaults.sections_visible, ...saved.sections_visible },
  }
}

export const FONT_LABELS: Record<NonNullable<PageSettings['bio_font']>, string> = {
  default: 'Sans-serif',
  serif: 'Serif',
  mono: 'Monospace',
}

export const FONT_FAMILIES: Record<NonNullable<PageSettings['bio_font']>, string> = {
  default: 'inherit',
  serif: 'Georgia, serif',
  mono: '"JetBrains Mono", monospace',
}

export const ACCENT_PRESETS = [
  '#6366F1', // indigo (défaut)
  '#EC4899', // rose
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
]

export const SECTION_LABELS: Record<SectionKey, string> = {
  portfolio: 'Portfolio',
  reviews: 'Avis',
  availability: 'Disponibilités',
  badges: 'Badges de confiance',
}
