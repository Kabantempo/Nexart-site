#!/bin/bash

# Nexart v1.2.0 API Test Suite
# Usage: bash test-v1.2.0-endpoints.sh [base_url] [event_id]

BASE_URL="${1:-http://localhost:3000}"
EVENT_ID="${2:-test-event-id}"
CRON_TOKEN="your-cron-secret-token"

echo "🧪 Nexart v1.2.0 API Tests"
echo "Base URL: $BASE_URL"
echo "Event ID: $EVENT_ID"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Helper function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4

  echo -e "${YELLOW}Testing${NC} $method $endpoint"
  echo "Description: $description"

  if [ "$method" == "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X $method \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint")
  fi

  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | sed '$d')

  if [[ $http_code =~ ^(200|201|202|204)$ ]]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
    FAILED=$((FAILED + 1))
  fi

  # Show response body (first 200 chars)
  echo "Response: ${body:0:200}..."
  echo ""
}

# ============================================================================
# TEST SUITE
# ============================================================================

echo -e "${YELLOW}=== HEALTH CHECK ===${NC}"
test_endpoint "GET" "/api/health" "" "Verify API is running"

echo -e "${YELLOW}=== ANALYTICS ===${NC}"
test_endpoint "GET" "/api/events/$EVENT_ID/analytics" "" "Get event fill rate and applications breakdown"
test_endpoint "GET" "/api/creator/analytics" "" "Get creator profile views and acceptance rate"

echo -e "${YELLOW}=== AUTO-REMINDERS ===${NC}"
test_endpoint "GET" "/api/events/$EVENT_ID/reminders" "" "Trigger reminder cron job (requires Bearer token in production)"
test_endpoint "POST" "/api/events/$EVENT_ID/reminders" \
  '{"first_reminder_days": 7, "second_reminder_days": 14}' \
  "Update reminder settings"

echo -e "${YELLOW}=== WAITLIST ===${NC}"
test_endpoint "GET" "/api/events/$EVENT_ID/waitlist" "" "Get waitlist queue"
test_endpoint "POST" "/api/events/$EVENT_ID/waitlist" \
  '{"exhibitor_id": "test-id", "action": "add", "reason": "Sold out"}' \
  "Add exhibitor to waitlist"
test_endpoint "POST" "/api/events/$EVENT_ID/waitlist" \
  '{"exhibitor_id": "test-id", "action": "cancel"}' \
  "Cancel exhibitor and notify next"

echo -e "${YELLOW}=== AUTO-RESPONDER ===${NC}"
test_endpoint "POST" "/api/events/$EVENT_ID/faqs/match" \
  '{"exhibitor_id": "test-id", "application_text": "I sell pottery", "application_data": {"discipline": "ceramics"}}' \
  "Match application against FAQs (confidence scoring)"

echo -e "${YELLOW}=== CAMPAIGNS ===${NC}"
test_endpoint "GET" "/api/events/$EVENT_ID/campaigns" "" "Get all email campaigns"
test_endpoint "POST" "/api/events/$EVENT_ID/campaigns" \
  '{"title": "Test Campaign", "subject": "Hello", "message": "Test message"}' \
  "Create new email campaign"

echo -e "${YELLOW}=== TEAM ===${NC}"
test_endpoint "GET" "/api/events/$EVENT_ID/team" "" "Get team members"

echo -e "${YELLOW}=== VOLUNTEERS ===${NC}"
test_endpoint "GET" "/api/events/$EVENT_ID/volunteers" "" "Get all volunteers"
test_endpoint "GET" "/api/events/$EVENT_ID/volunteers/shifts" "" "Get all volunteer shifts"
test_endpoint "POST" "/api/events/$EVENT_ID/volunteers/shifts" \
  '{"date": "2026-08-15", "time": "09:00", "capacity": 5, "role": "Reception"}' \
  "Create new volunteer shift"

# ============================================================================
# SUMMARY
# ============================================================================

echo -e "${YELLOW}=== TEST SUMMARY ===${NC}"
TOTAL=$((PASSED + FAILED))
echo -e "Total: $TOTAL | ${GREEN}Passed: $PASSED${NC} | ${RED}Failed: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
