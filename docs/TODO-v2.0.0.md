# v2.0.0 — Mini-Boutique & Creator Economy

**Timeline**: 4-6 weeks
**Target**: Q3-Q4 2026
**Dependencies**: v1.1.0 must be live first

---

## Mini-Boutique for Creators (5-7 days)

### Concept
Creators can sell digital products (presets, templates, guides) or physical goods (prints, PDFs) through their profile.

### Backend Setup
- [ ] `creator_products` table (product_id, creator_id, title, description, price, file_url, category, status)
- [ ] `product_purchases` table (purchase_id, product_id, buyer_id, amount, date)
- [ ] Stripe integration for product payments
- [ ] Digital delivery (email with download link)
- [ ] Refund handling

### Frontend
- [ ] Creator product page (`/creator/:id/shop`)
- [ ] Product cards (image, title, price, rating)
- [ ] Product detail page with file preview (if PDF)
- [ ] Purchase flow via Stripe
- [ ] Download link after purchase
- [ ] Creator earnings dashboard

### Creator Tools
- [ ] Upload product (title + description + file + price)
- [ ] Product analytics (sales, revenue, download count)
- [ ] Edit/delete products
- [ ] Bulk upload products (CSV)

---

## Commission Structure (2-3 days)

### Setup
- [ ] Define commission % (e.g., Nexart takes 15%)
- [ ] Automatic calculation on every sale
- [ ] Creator receives 85% after commission
- [ ] Monthly payouts via Stripe Connect

### Backend
- [ ] `payouts` table (creator_id, amount, date, status)
- [ ] Payout processing (monthly via Stripe)
- [ ] Tax calculation (if applicable)

### Frontend
- [ ] Payout history page (creator dashboard)
- [ ] Tax receipt generation (optional)

---

## Affiliate Program (3-5 days)

### Concept
Creators can get referral links to earn commission when creators/organizers sign up.

### Backend
- [ ] `referrals` table (referrer_id, referred_id, type, commission, date)
- [ ] Tracking referral signups via link
- [ ] Commission calculation + storage
- [ ] Automatic payouts based on conversions

### Frontend
- [ ] Creator dashboard: "Share your referral link"
- [ ] Copy link + QR code
- [ ] Referral history (who signed up, earnings)
- [ ] Commission rates displayed (0.50€ per creator signup, 1€ per organizer)

### Commission Rates
- Creator signup: €0.50
- Organizer signup: €1.00
- Paid subscription: €2.00 (if applicable later)

---

## Creator Coaching / Mentorship (4-6 days)

### Concept
Experienced creators can offer 1:1 sessions to help new creators grow.

### Backend
- [ ] `coaching_sessions` table (coach_id, student_id, date, duration, price, topic, notes)
- [ ] Availability calendar (coach selects open slots)
- [ ] Booking system with confirmation
- [ ] Payment processing (split between coach and Nexart)

### Frontend
- [ ] "Find a Coach" page (filtered by specialty, rating, availability)
- [ ] Coach profile with bio + rate + reviews
- [ ] Calendar booking (Calendly-style)
- [ ] Video call integration (Jitsi/Loom preview link)
- [ ] Post-session feedback + rating
- [ ] Student dashboard: upcoming sessions + recordings

### Coach Dashboard
- [ ] Set hourly rate
- [ ] Manage availability
- [ ] Earnings summary
- [ ] Student reviews

---

## Event Sponsorship Listings (2-3 days)

### Concept
Brands can sponsor events, and organizers can list sponsorship opportunities.

### Backend
- [ ] `sponsorships` table (sponsor_id, event_id, package, price, status)
- [ ] Sponsorship packages (Bronze €500, Silver €1000, Gold €2000)
- [ ] Payment processing

### Frontend
- [ ] Event detail: "Sponsorship opportunities" section
- [ ] Sponsorship inquiry form
- [ ] Sponsor logo display on event page
- [ ] Sponsor dashboard (upcoming events, logo uploads)

---

## Marketplace for Event Services (3-5 days)

### Concept
Third-party services (catering, sound, lighting, etc.) can be listed for event organizers to book.

### Services
- Event catering
- Sound/lighting equipment rental
- Event insurance
- Transportation
- Photographer/videographer
- Cleaning services

### Backend
- [ ] `event_services` table (service_id, provider_id, title, description, price, category, availability)
- [ ] Booking system with payment
- [ ] Reviews + ratings

### Frontend
- [ ] "Event Services" marketplace page
- [ ] Filter by category/rating/price
- [ ] Service detail page
- [ ] Booking form + payment
- [ ] Service provider profile

---

## Creator Collaboration Features (2-3 days)

### Concept
Creators can collaborate on joint projects or cross-promote.

### Features
- [ ] "Collaboration" section on creator profile
- [ ] Browse other creators (filter by discipline, location)
- [ ] Send collaboration request
- [ ] Agree on terms (revenue split, timeline)
- [ ] Message thread for collaboration
- [ ] Joint event/product listing (co-authored)
- [ ] Revenue split automatic calculation

---

## Analytics & Insights Suite (3-4 days)

### Creator Analytics
- [ ] Views + saves per product
- [ ] Sales funnel (viewers → buyers)
- [ ] Revenue over time (chart)
- [ ] Top products
- [ ] Geographic breakdown of buyers
- [ ] Referral performance

### Organizer Analytics (enhanced)
- [ ] Creator performance ranking (by feedback, sales)
- [ ] Revenue by event type
- [ ] Attendance predictions (AI-powered)
- [ ] Marketing ROI breakdown

---

## Subscription / VIP Tiers (3-5 days)

### Concept
Creators/organizers pay monthly for premium features.

### Tiers
**Free**
- 1 event/product listing
- Basic analytics
- Community support

**Creator Pro** (€9.99/month)
- Unlimited products
- Advanced analytics
- Priority support
- No commission on first €500/month

**Organizer Pro** (€19.99/month)
- All features
- Custom branding on event page
- API access
- Email support

### Backend
- [ ] `subscriptions` table (user_id, tier, start_date, renewal_date, status)
- [ ] Recurring Stripe billing
- [ ] Feature gating based on tier

### Frontend
- [ ] Pricing page with comparison table
- [ ] Subscribe button (modal)
- [ ] Subscription management (upgrade/downgrade/cancel)
- [ ] Billing history

---

## Social Features & Community (2-3 days)

### Features
- [ ] Creator feeds (timeline of new products)
- [ ] Follow/unfollow (if not already done in v1.1)
- [ ] Like/comment on creator posts
- [ ] Creator badges (top rated, verified, pro, trending)
- [ ] Creator rankings (by rating, followers, sales)
- [ ] "Trending this week" carousel

---

## Payment Localization (2 days)

### Support Multiple Currencies
- [ ] Support EUR (primary)
- [ ] Support GBP (if expanding UK)
- [ ] Support CHF (if expanding Switzerland)
- [ ] Automatic currency conversion
- [ ] Display prices in user's currency

### Stripe Setup
- [ ] Multi-currency Stripe account
- [ ] Tax handling per country

---

## Compliance & Legal (1-2 days)

- [ ] GDPR compliance audit
- [ ] Terms of service update (seller terms)
- [ ] Refund policy documentation
- [ ] Tax compliance (VAT for EU sellers)
- [ ] Payout reporting (1099 equivalent)

---

## Definition of Done (v2.0.0)

- [x] Mini-boutique fully functional (upload, sell, download)
- [x] Commission system automated
- [x] Affiliate program live
- [x] Coaching system (booking + payments)
- [x] Event sponsorships live
- [x] Marketplace for services integrated
- [x] Advanced analytics deployed
- [x] VIP subscription tiers active
- [x] Social features enhanced

---

## Time Breakdown

| Feature | Time | Owner |
|---------|------|-------|
| Mini-Boutique | 5-7d | Claude |
| Commission Structure | 2-3d | Claude |
| Affiliate Program | 3-5d | Claude |
| Creator Coaching | 4-6d | Claude |
| Event Sponsorships | 2-3d | Claude |
| Event Services Marketplace | 3-5d | Claude |
| Creator Collaboration | 2-3d | Claude |
| Analytics Suite | 3-4d | Claude |
| Subscription Tiers | 3-5d | Claude |
| Social Features | 2-3d | Claude |
| Payment Localization | 2d | Claude |
| Compliance | 1-2d | Claude |
| **Total** | **4-6w** | |

---

## Revenue Model Summary (v2.0.0)

| Source | Rate | Notes |
|--------|------|-------|
| Product sales commission | 15% | Creator retains 85% |
| Referral fees | €0.50-2.00 | Per signup |
| Affiliate commission | 5-10% | On referred sales |
| Coaching fees | 20% | Platform takes 20%, coach gets 80% |
| Sponsorships | Flat fee | Marketplace listing |
| Subscription tiers | €9.99-19.99/mo | Recurring MRR |
| Event services commission | 10% | Service provider fees |

**Estimated annual revenue at scale (10K active creators)**: €50K-100K+ MRR
