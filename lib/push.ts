// Send push notifications to one or more users (internal server-side helper)
// Calls /api/push/send with CRON_SECRET_TOKEN — fire-and-forget, never throws
export async function sendPushToUsers(
  user_ids: string[],
  title: string,
  body: string,
  url?: string
) {
  if (!user_ids.length || !process.env.CRON_SECRET_TOKEN) return

  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://nexart.fr'

  try {
    await fetch(`${base}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET_TOKEN}`,
      },
      body: JSON.stringify({ user_ids, title, body, url }),
    })
  } catch {
    // push is best-effort, never block the main flow
  }
}
