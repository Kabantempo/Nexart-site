export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export async function generateUniqueEventSlug(admin: any, title: string): Promise<string> {
  const base = slugify(title)
  let slug = base
  let i = 2
  while (true) {
    const { data } = await admin.from('events').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    slug = `${base}-${i++}`
  }
}

export async function generateUniqueUsername(admin: any, fullName: string): Promise<string> {
  const base = slugify(fullName) || 'user'
  let username = base
  let i = 2
  while (true) {
    const { data } = await admin.from('profiles').select('id').eq('username', username).maybeSingle()
    if (!data) return username
    username = `${base}-${i++}`
  }
}
