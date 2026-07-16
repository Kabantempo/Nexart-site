#!/bin/bash
# Test all Nexart API endpoints against prod
# Usage: ./scripts/test-endpoints.sh [BASE_URL]
# Default: https://nexart.fr

BASE="${1:-https://nexart.fr}"
PASS=0
FAIL=0
SKIP=0

check() {
  local method="$1"
  local path="$2"
  local expected="$3"
  local note="${4:-}"

  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE$path" \
    -H "Content-Type: application/json" --max-time 10)

  if [[ "$code" == "$expected" || "$code" == "401" || "$code" == "403" ]]; then
    echo "✅ $method $path → $code $note"
    ((PASS++))
  elif [[ "$expected" == "SKIP" ]]; then
    echo "⏭️  $method $path → $code (skipped — requires auth/body) $note"
    ((SKIP++))
  else
    echo "❌ $method $path → $code (expected $expected) $note"
    ((FAIL++))
  fi
}

echo "=== Nexart API Endpoint Test ==="
echo "Base: $BASE"
echo "Date: $(date)"
echo ""

# ── Health ──────────────────────────────────────────────────────────────────
check GET  /api/health          200

# ── Auth ────────────────────────────────────────────────────────────────────
check GET  /api/auth/me         401 "(requires token)"

# ── Events ──────────────────────────────────────────────────────────────────
check GET  /api/events          200
check POST /api/events          401 "(requires auth)"
check GET  "/api/events/00000000-0000-0000-0000-000000000000"        404
check PATCH "/api/events/00000000-0000-0000-0000-000000000000"       401
check DELETE "/api/events/00000000-0000-0000-0000-000000000000"      401

# ── Event sub-routes (UUID placeholder → expect 400 or 401) ─────────────────
EV="00000000-0000-0000-0000-000000000000"
check GET  "/api/events/$EV/analytics"          401
check GET  "/api/events/$EV/campaigns"          401
check POST "/api/events/$EV/campaigns"          401
check GET  "/api/events/$EV/checklists"         401
check GET  "/api/events/$EV/exhibitor-fields"   401
check POST "/api/events/$EV/exhibitor-fields"   401
check GET  "/api/events/$EV/exhibitors"         401
check POST "/api/events/$EV/exhibitors"         401
check GET  "/api/events/$EV/exhibitors/export"  401
check GET  "/api/events/$EV/faqs"               200
check GET  "/api/events/$EV/marketing"          401
check GET  "/api/events/$EV/reminders"          401
check GET  "/api/events/$EV/tasks"              401
check GET  "/api/events/$EV/team"               401
check POST "/api/events/$EV/team/invite"        401
check GET  "/api/events/$EV/volunteers"         401
check GET  "/api/events/$EV/volunteers/shifts"  401
check GET  "/api/events/$EV/waitlist"           401

# ── Admin routes (expect 401 without token) ─────────────────────────────────
check GET  /api/admin/analytics   401
check GET  /api/admin/events      401
check GET  /api/admin/reports     401
check GET  /api/admin/stats       401
check GET  /api/admin/users       401
check GET  /api/admin/search-users 401
check POST /api/admin/set-role    401
check POST /api/admin/set-tier    401
check POST /api/admin/verify-creator 401

# ── Credits ─────────────────────────────────────────────────────────────────
check GET  /api/credits/balance   401
check POST /api/credits/use       401
check POST /api/credits/admin-add 401

# ── Creator / Itinerary ─────────────────────────────────────────────────────
check GET  /api/creator/analytics 401
check GET  /api/itinerary         401

# ── Notifications / Push ────────────────────────────────────────────────────
check POST /api/push/subscribe    401
check POST /api/push/send         401

# ── Audit / Reports ─────────────────────────────────────────────────────────
check GET  /api/audit-logs        401
check GET  /api/reports           401
check POST /api/reports           401

# ── Reviews ─────────────────────────────────────────────────────────────────
check GET  /api/reviews           401
check POST /api/reviews           401

# ── Contracts ───────────────────────────────────────────────────────────────
check POST /api/contracts/generate 401
check POST /api/contracts/sign     401

# ── Messaging ───────────────────────────────────────────────────────────────
check POST /api/message-notify    401

# ── Account ─────────────────────────────────────────────────────────────────
check POST /api/account/delete-request 401
check GET  /api/account/export-data    401

# ── Contact / Newsletter ────────────────────────────────────────────────────
check POST /api/contact           200
check POST /api/newsletter        200

# ── Verification ────────────────────────────────────────────────────────────
check POST /api/verify-siret      401
check POST /api/rna               200
check POST /api/verification-email 401

# ── Stripe (expect 400 without signature) ───────────────────────────────────
check POST /api/stripe/webhook    400 "(no stripe signature)"
check POST /api/stripe/checkout   401
check POST /api/stripe/portal     401

# ── Cron (expect 401 without CRON_SECRET) ───────────────────────────────────
check POST /api/cron/send-reminders   401
check POST /api/cron/hard-delete-users 401

# ── Applications ────────────────────────────────────────────────────────────
check POST /api/application-received  401
check POST /api/application-status    401

echo ""
echo "=== Results ==="
echo "✅ Pass: $PASS"
echo "❌ Fail: $FAIL"
echo "⏭️  Skip: $SKIP"
echo "Total: $((PASS + FAIL + SKIP))"

if [[ $FAIL -gt 0 ]]; then
  exit 1
fi
