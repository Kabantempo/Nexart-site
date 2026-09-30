const SUPABASE_STORAGE = '/storage/v1/object/'
const SUPABASE_RENDER  = '/storage/v1/render/image/'

interface ImgOpts {
  width?:   number
  quality?: number
  format?:  'webp' | 'avif'
}

export function supabaseImg(url: string | null | undefined, opts: ImgOpts = {}): string {
  if (!url) return ''
  if (!url.includes(SUPABASE_STORAGE)) return url

  const transformed = url.replace(SUPABASE_STORAGE, SUPABASE_RENDER)
  const params = new URLSearchParams()
  if (opts.width)   params.set('width',   String(opts.width))
  params.set('quality', String(opts.quality ?? 80))
  if (opts.format)  params.set('format',  opts.format)
  return `${transformed}?${params.toString()}`
}
