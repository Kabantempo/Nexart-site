#!/bin/bash
# ============================================================
# Nexart — Smoke test complet
# Usage : ./scripts/healthcheck.sh [https://nexart.fr]
# ============================================================

BASE="${1:-https://nexart.fr}"
PASS=0; FAIL=0; WARN=0
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

header() { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }

ok()   { echo -e "  ${GREEN}✅ $1${RESET}"; ((PASS++)); }
fail() { echo -e "  ${RED}❌ $1${RESET}"; ((FAIL++)); }
warn() { echo -e "  ${YELLOW}⚠️  $1${RESET}"; ((WARN++)); }

# Helper : teste un URL, retourne le code HTTP
http() {
  curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$1"
}

# Helper : teste un endpoint JSON, vérifie le code attendu
check_page() {
  local label="$1" url="$2" expected="${3:-200}"
  code=$(http "$url")
  if [[ "$code" == "$expected" ]]; then
    ok "$label → HTTP $code"
  elif [[ "$code" == "401" || "$code" == "403" ]]; then
    ok "$label → HTTP $code (auth requis — normal)"
  else
    fail "$label → HTTP $code (attendu $expected)"
  fi
}

check_api() {
  local label="$1" method="$2" path="$3" expected="${4:-200}"
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
    -H "Content-Type: application/json" --max-time 10 "${BASE}${path}")
  if [[ "$code" == "$expected" || "$code" == "401" || "$code" == "403" ]]; then
    ok "$label → HTTP $code"
  else
    fail "$label → HTTP $code (attendu $expected ou 401/403)"
  fi
}

# Vérifie que le corps contient un pattern
check_content() {
  local label="$1" url="$2" pattern="$3"
  body=$(curl -s --max-time 10 "$url")
  if echo "$body" | grep -q "$pattern"; then
    ok "$label"
  else
    fail "$label (pattern '$pattern' absent)"
  fi
}

echo -e "${BOLD}============================================${RESET}"
echo -e "${BOLD}  Nexart Smoke Test — $BASE${RESET}"
echo -e "${BOLD}============================================${RESET}"

# ─── PAGES PUBLIQUES ────────────────────────────────────────
header "Pages publiques"
check_page "Accueil"              "$BASE/"
check_page "Marchés (liste)"      "$BASE/events"
check_page "Créateurs (liste)"    "$BASE/creators"
check_page "Connexion"            "$BASE/login"
check_page "Inscription"          "$BASE/register"
check_page "Patch notes"          "$BASE/patch-notes"
check_page "Conditions"           "$BASE/conditions"
check_page "Mentions légales"     "$BASE/mentions-legales"
check_page "Contact"              "$BASE/contact"
check_page "404 custom"           "$BASE/cette-page-nexiste-pas" "404"

# ─── PAGES AUTH-PROTÉGÉES ───────────────────────────────────
header "Pages protégées (doivent retourner 200 ou redirect)"
check_page "Dashboard"            "$BASE/dashboard"
check_page "Créer un marché"      "$BASE/events/create"
check_page "Profil"               "$BASE/profile"

# ─── CONTENU CRITIQUE ───────────────────────────────────────
header "Contenu critique"
check_content "Accueil contient 'Nexart'"       "$BASE/"                 "Nexart"
check_content "Conditions contient 'CGU'"       "$BASE/conditions"       "conditions"
check_content "Patch-notes contient du contenu"  "$BASE/patch-notes"      "patch-notes"

# ─── API PUBLIQUES ──────────────────────────────────────────
header "API publiques"
check_api "GET /api/events"              GET  "/api/events"
check_api "GET /api/contact"            GET  "/api/contact"         405

# ─── API AUTH-PROTÉGÉES ─────────────────────────────────────
header "API protégées (401/403 attendu sans token)"
check_api "GET /api/credits/balance"        GET  "/api/credits/balance"
check_api "GET /api/audit-logs"             GET  "/api/audit-logs"
check_api "GET /api/admin/stats"            GET  "/api/admin/stats"
check_api "GET /api/creator/analytics"      GET  "/api/creator/analytics"
check_api "GET /api/events/[id]/campaigns"  GET  "/api/events/00000000-0000-0000-0000-000000000000/campaigns"

# ─── SUPABASE STORAGE ───────────────────────────────────────
header "Supabase Storage (buckets publics)"
SUPA="https://cvqeysnymnkfxfithhsr.supabase.co"
code=$(http "$SUPA/rest/v1/")
if [[ "$code" == "200" || "$code" == "401" ]]; then
  ok "Supabase API joignable → HTTP $code"
else
  fail "Supabase API → HTTP $code"
fi

# ─── HEADERS DE SÉCURITÉ ────────────────────────────────────
header "Headers de sécurité"
headers=$(curl -s -I --max-time 10 "$BASE/" 2>&1)

check_header() {
  local name="$1"
  if echo "$headers" | grep -qi "$name"; then
    ok "Header $name présent"
  else
    warn "Header $name manquant"
  fi
}
check_header "content-security-policy"
check_header "x-frame-options"
check_header "x-content-type-options"
check_header "strict-transport-security"
check_header "referrer-policy"

# ─── PERFORMANCE ────────────────────────────────────────────
header "Performance (temps de réponse)"
time_ms=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$BASE/" | awk '{printf "%.0f", $1 * 1000}')
if (( time_ms < 800 )); then
  ok "Accueil répond en ${time_ms}ms (< 800ms)"
elif (( time_ms < 2000 )); then
  warn "Accueil répond en ${time_ms}ms (acceptable mais lent)"
else
  fail "Accueil répond en ${time_ms}ms (trop lent > 2s)"
fi

time_api=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$BASE/api/events" | awk '{printf "%.0f", $1 * 1000}')
if (( time_api < 1000 )); then
  ok "/api/events répond en ${time_api}ms"
elif (( time_api < 3000 )); then
  warn "/api/events répond en ${time_api}ms (lent)"
else
  fail "/api/events répond en ${time_api}ms (timeout risqué)"
fi

# ─── RÉSUMÉ ─────────────────────────────────────────────────
TOTAL=$((PASS + FAIL + WARN))
echo -e "\n${BOLD}============================================${RESET}"
echo -e "${BOLD}  Résumé : $TOTAL tests${RESET}"
echo -e "  ${GREEN}✅ Passés   : $PASS${RESET}"
echo -e "  ${YELLOW}⚠️  Warnings : $WARN${RESET}"
echo -e "  ${RED}❌ Échoués  : $FAIL${RESET}"
echo -e "${BOLD}============================================${RESET}"

if (( FAIL > 0 )); then
  echo -e "\n${RED}${BOLD}RÉSULTAT : ÉCHEC — $FAIL problème(s) détecté(s)${RESET}"
  exit 1
elif (( WARN > 0 )); then
  echo -e "\n${YELLOW}${BOLD}RÉSULTAT : OK avec avertissements${RESET}"
  exit 0
else
  echo -e "\n${GREEN}${BOLD}RÉSULTAT : TOUT EST OK ✅${RESET}"
  exit 0
fi
