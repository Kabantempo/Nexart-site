# v1.2.0 API Test Suite

Complete testing suite for Nexart v1.2.0 features with comprehensive error handling.

## Setup

### 1. Environment Variables

Ensure `.env.local` has all required vars:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron Jobs (for testing reminders endpoint)
CRON_SECRET_TOKEN=your-secret-cron-token

# Email (for reminder + waitlist notifications)
RESEND_API_KEY=your-resend-api-key

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Start Dev Server

```bash
npm run dev
# Server will run on http://localhost:3000
```

### 3. Verify Supabase Connection

```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok","ts":...}
```

---

## Testing Methods

### Option A: Bash Script (Quick)

```bash
bash tests/test-v1.2.0-endpoints.sh
# Tests all 15 endpoints with colored output
# Uses localhost:3000 by default
```

**Output Format**:
- ✓ PASS (HTTP 200/201)
- ✗ FAIL (HTTP 4xx/5xx)
- Shows response snippet

---

### Option B: Postman (GUI)

1. Import `Nexart-v1.2.0.postman_collection.json` into Postman
2. Set environment variables:
   - `base_url`: http://localhost:3000
   - `event_id`: test-event-id (or real ID from DB)
   - `exhibitor_id`: test-exhibitor-id
   - `cron_token`: your-secret-token
3. Run individual requests or entire collection

---

### Option C: Curl (Manual)

```bash
# Health check
curl http://localhost:3000/api/health

# Get event analytics
curl http://localhost:3000/api/events/[EVENT_ID]/analytics

# Get waitlist
curl http://localhost:3000/api/events/[EVENT_ID]/waitlist

# Add to waitlist
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"exhibitor_id":"test-id","action":"add","reason":"Sold out"}' \
  http://localhost:3000/api/events/[EVENT_ID]/waitlist

# Trigger reminders (requires Bearer token)
curl -H "Authorization: Bearer YOUR_CRON_TOKEN" \
  http://localhost:3000/api/events/[EVENT_ID]/reminders

# Match FAQ against application
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "exhibitor_id":"test-id",
    "application_text":"I sell handmade jewelry",
    "application_data":{"discipline":"jewelry"}
  }' \
  http://localhost:3000/api/events/[EVENT_ID]/faqs/match
```

---

## Endpoints Tested

### Analytics
- `GET /api/events/[id]/analytics` — Event fill rate + applications breakdown
- `GET /api/creator/analytics` — Creator profile views + acceptance rate

### Auto-Reminders
- `GET /api/events/[id]/reminders` — Trigger cron job (requires Bearer token)
- `POST /api/events/[id]/reminders` — Update reminder settings

### Waitlist
- `GET /api/events/[id]/waitlist` — List queue
- `POST /api/events/[id]/waitlist` — Add/cancel exhibitor
- `PATCH /api/events/[id]/waitlist` — Move to approved
- `DELETE /api/events/[id]/waitlist` — Remove + reorder

### Auto-Responder
- `POST /api/events/[id]/faqs/match` — Match application vs FAQs

### Campaigns
- `GET /api/events/[id]/campaigns` — List campaigns
- `POST /api/events/[id]/campaigns` — Create campaign

### Team
- `GET /api/events/[id]/team` — List team members

### Volunteers
- `GET /api/events/[id]/volunteers` — List volunteers
- `GET /api/events/[id]/volunteers/shifts` — List shifts
- `POST /api/events/[id]/volunteers/shifts` — Create shift

---

## Error Handling

All endpoints return structured error responses:

```json
{
  "error": "User-friendly error message",
  "details": "Technical error details",
  "event_id": "context information",
  "timestamp": "2026-07-10T19:00:00.000Z"
}
```

**Console Logs**: Check terminal where `npm run dev` runs:
- `✓ Operation successful` — for important operations
- `❌ Error occurred` — with full context (event_id, error, timestamp)

---

## Common Issues

### 500 Server Misconfigured
**Issue**: `"Server misconfigured: CRON_SECRET_TOKEN not set"`

**Fix**: Add to `.env.local`:
```
CRON_SECRET_TOKEN=test-secret-token
```

### 500 Supabase Error
**Issue**: `"supabaseKey is required"`

**Fix**: Verify env vars in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 404 Not Found
**Issue**: Endpoint doesn't exist

**Fix**: Check URL spelling and HTTP method (GET vs POST)

### 401 Unauthorized
**Issue**: Bearer token validation failed

**Fix**: Ensure `Authorization: Bearer YOUR_TOKEN` header matches CRON_SECRET_TOKEN

---

## Production Testing

When deploying to Hostinger:

1. Update `.env.production` with production Supabase keys
2. Set production CRON_SECRET_TOKEN
3. Configure EasyCron to call reminders endpoint daily:
   ```
   URL: https://nexart.fr/api/events/[EVENT_ID]/reminders
   Header: Authorization: Bearer $CRON_SECRET_TOKEN
   Schedule: 2:00 AM UTC daily
   ```
4. Test endpoints on live site:
   ```bash
   bash tests/test-v1.2.0-endpoints.sh https://nexart.fr EVENT_ID
   ```

---

## Test Coverage

- ✅ 15 endpoints tested
- ✅ GET, POST, PATCH, DELETE methods
- ✅ Error handling verified
- ✅ Bearer token auth tested
- ✅ Request/response validation

---

**Last Updated**: 10 juillet 2026  
**Status**: Ready for production testing
