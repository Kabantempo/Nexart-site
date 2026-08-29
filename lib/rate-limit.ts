type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

// Clean stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  store.forEach((v, k) => { if (v.resetAt < now) store.delete(k) })
}, 5 * 60 * 1000)

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}
