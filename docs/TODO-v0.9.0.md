# v0.9.0 — Foundation Polishing

**Timeline**: 1-2 weeks
**Target**: Mid-July 2026

---

## Quick Wins (1-2 days)

### Géolocalisation /creators
- [ ] Add "Autour de moi" button on /creators page
- [ ] Get user location (browser geolocation API)
- [ ] Filter creators by radius (Haversine formula)
- [ ] Show distance on creator cards
- [ ] Add radius selector (5/10/25/50 km)
- [ ] Handle location permission denied
- [ ] Test on mobile (iOS/Android)

### Email Confirmation Banner
- [ ] Check if user email is verified
- [ ] Show persistent banner at top (yellow/warning style)
- [ ] Add "Resend email" button
- [ ] Add "Mark as confirmed" (for testing)
- [ ] Hide banner after confirmation
- [ ] Send verification email on signup

### Image Fallbacks
- [ ] Add placeholder for missing avatars
- [ ] Add placeholder for missing portfolio images
- [ ] Add placeholder for missing event photos
- [ ] Consistent styling across app

### Better Error Messages
- [ ] Replace generic "Error" alerts with readable messages
- [ ] Network error: "Vérifiez votre connexion"
- [ ] Auth error: "Identifiants invalides"
- [ ] Server error: "Une erreur est survenue. Réessayez."
- [ ] Supabase RLS errors → user-friendly message

### Loading States
- [ ] Use skeletons for all data fetches
- [ ] Consistent loading animation
- [ ] Show loading state in buttons (disabled + spinner)
- [ ] Loading state for form submissions

---

## Medium Tasks (3-5 days)

### 2FA TOTP Setup
- [ ] Enable Supabase MFA in production
- [ ] Create QR code generator (react-qr-code)
- [ ] Add /auth/2fa page
- [ ] Backup codes generation + display
- [ ] Verify TOTP code on login
- [ ] Remember device option (30 days)
- [ ] Test with Google Authenticator

### Creator Search Autocomplete
- [ ] Add search input on /creators page
- [ ] Debounced search query (500ms)
- [ ] Filter by name/disciplines/city
- [ ] Show suggestions in dropdown
- [ ] Highlight matches
- [ ] Clear search button

### Event Filters Persistence
- [ ] Save filters to localStorage
- [ ] Restore filters on page reload
- [ ] Add "Save filters" button
- [ ] Add "Clear all filters" button
- [ ] Show active filter count badge

### Organizer Email Notifications
- [ ] Send email when application received
- [ ] Send email when application accepted/rejected
- [ ] Send email when new message received
- [ ] Email template styling
- [ ] Unsubscribe link in emails
- [ ] Test with SendGrid/Resend

### Creator Dashboard Stats
- [ ] Total applications (this month)
- [ ] Acceptance rate (%)
- [ ] Earnings from events (if applicable)
- [ ] Upcoming events widget
- [ ] Recent applications list
- [ ] Chart: applications over time (optional)

---

## Polish (2-3 days)

### Motion/Animations
- [ ] Review all Framer Motion animations
- [ ] Reduce duration if too slow (0.3s → default)
- [ ] Consistent stagger delays
- [ ] Test performance (60fps)
- [ ] Disable animations for prefers-reduced-motion

### Mobile Responsiveness Audit
- [ ] Test all pages on iPhone SE (small screen)
- [ ] Test all pages on iPad (large screen)
- [ ] Check button/input sizes (min 44px)
- [ ] Fix layout shifts
- [ ] Test modals on mobile
- [ ] Landscape orientation support

### Form Validation
- [ ] Email validation (RFC 5322)
- [ ] Password strength indicator
- [ ] Confirm password match
- [ ] Required field indicators
- [ ] Error messages below inputs (not alerts)
- [ ] Real-time validation feedback

### Toast/Notification Consistency
- [ ] Standardize toast position (bottom-right)
- [ ] Consistent colors (success=green, error=red, info=blue)
- [ ] Toast auto-dismiss (2-3s)
- [ ] Max 3 toasts visible at once (queue rest)
- [ ] Test on all major workflows

---

## Testing Checklist

- [ ] All pages load (200 status)
- [ ] No console errors
- [ ] Forms submit successfully
- [ ] Navigation works (no broken links)
- [ ] Mobile: all pages responsive
- [ ] Accessibility: keyboard navigation works
- [ ] Performance: Lighthouse > 90
- [ ] Staging deploy successful

---

## Definition of Done (v0.9.0)

- [x] All tasks above completed
- [x] Code reviewed (no warnings)
- [x] Tests pass (if applicable)
- [x] Staging tested by user
- [x] Bump version to 0.9.0
- [x] Tag release on GitHub
- [x] Deploy to production
- [x] Monitor errors for 24h

---

## Time Breakdown

| Task | Time | Owner |
|------|------|-------|
| Quick Wins | 1-2d | Claude |
| Medium Tasks | 3-5d | Claude |
| Polish | 2-3d | Claude |
| Testing & Deploy | 1d | Claude |
| **Total** | **1-2w** | |
