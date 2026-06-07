export function trackApplicationSubmit(eventId: string, userId?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics] application_submit', { eventId, userId })
  }
}
