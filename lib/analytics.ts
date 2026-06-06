// Send events to Google Tag Manager / Google Analytics
export function trackEvent(eventName: string, data?: Record<string, any>) {
  if (typeof window !== 'undefined' && 'dataLayer' in window) {
    (window as any).dataLayer.push({
      event: eventName,
      ...data,
    })
  }
}

// Track form submissions
export function trackFormSubmit(formName: string, data?: Record<string, any>) {
  trackEvent('form_submit', {
    form_name: formName,
    ...data,
  })
}

// Track application submissions
export function trackApplicationSubmit(eventId: string, userId?: string) {
  trackEvent('application_submit', {
    event_id: eventId,
    user_id: userId,
  })
}

// Track page views (automatic via GTM, but can be manual)
export function trackPageView(pageName: string) {
  trackEvent('page_view', {
    page_name: pageName,
  })
}

// Track user interactions
export function trackButtonClick(buttonName: string, context?: string) {
  trackEvent('button_click', {
    button_name: buttonName,
    context,
  })
}
