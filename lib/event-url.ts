/** Returns the canonical URL segment for an event (slug when available, UUID otherwise). */
export function eventUrl(event: { id: string; slug?: string | null }, ...subpaths: string[]): string {
  const base = `/events/${event.slug || event.id}`
  return subpaths.length ? `${base}/${subpaths.join('/')}` : base
}
