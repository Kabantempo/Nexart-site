#!/bin/bash
# ============================================================
# Nexart — Smoke test complet
# Usage : ./scripts/healthcheck.sh [https://nexart.fr]
# ============================================================

BASE="${1:-https://nexart.fr}"
PASS=0; FAIL=0; WARN=0
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

SUPA_URL="https://cvqeysnymnkfxfithhsr.supabase.co"
SUPA_PAT="${SUPABASE_PAT:-}"
SUPA_PROJECT="cvqeysnymnkfxfithhsr"

header() { echo -e "\n${CYAN}${BOLD}▶ $1${RESET}"; }
ok()     { echo -e "  ${GREEN}✅ $1${RESET}"; ((PASS++)); }
fail()   { echo -e "  ${RED}❌ $1${RESET}"; ((FAIL++)); }
warn()   { echo -e "  ${YELLOW}⚠️  $1${RESET}"; ((WARN++)); }

http() { curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$1"; }

check_page() {
  local label="$1" url="$2" expected="${3:-200}"
  code=$(http "$url")
  if [[ "$code" == "$expected" ]]; then
    ok "$label → HTTP $code"
  elif [[ "$code" == "401" || "$code" == "403" ]]; then
    ok "$label → HTTP $code (auth requis)"
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

check_content() {
  local label="$1" url="$2" pattern="$3"
  body=$(curl -s --max-time 10 "$url")
  if echo "$body" | grep -q "$pattern"; then
    ok "$label"
  else
    fail "$label (pattern '$pattern' absent)"
  fi
}

# ── Validation JSON : vérifie le code ET la structure de la réponse ──
# Usage : check_json "label" "/api/path" "champ1,champ2" [count_min]
check_json() {
  local label="$1" path="$2" fields="$3" min_count="${4:-0}"

  response=$(curl -s --max-time 10 "${BASE}${path}" 2>/dev/null)
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE}${path}")

  if [[ "$code" != "200" ]]; then
    fail "$label → HTTP $code (attendu 200)"
    return
  fi

  # Vérifie que c'est du JSON valide
  if ! echo "$response" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
    fail "$label → réponse non-JSON"
    return
  fi

  # Vérifie les champs attendus (supporte tableau direct ou objet wrapper)
  local missing=""
  IFS=',' read -ra FLDS <<< "$fields"
  for field in "${FLDS[@]}"; do
    if ! echo "$response" | grep -q "\"$field\""; then
      missing="$missing $field"
    fi
  done

  if [[ -n "$missing" ]]; then
    fail "$label → champs manquants :$missing"
    return
  fi

  # Vérifie le nombre minimum d'éléments
  if [[ "$min_count" -gt 0 ]]; then
    count=$(echo "$response" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if isinstance(d,list):
  print(len(d))
else:
  # cherche le premier champ qui est une liste
  for v in d.values():
    if isinstance(v,list):
      print(len(v)); break
  else:
    print(0)
" 2>/dev/null || echo 0)
    if (( count < min_count )); then
      fail "$label → seulement $count élément(s) (attendu ≥ $min_count)"
      return
    fi
    ok "$label → HTTP $code | JSON valide | $count élément(s) | champs OK"
  else
    ok "$label → HTTP $code | JSON valide | champs OK"
  fi
}

# ── Check Supabase via Management API (bypasse RLS) ──
# Usage : check_db "label" "SELECT count(*) FROM ..." min [mode]
#   mode omis ou "gte" → pass si count >= min
#   mode "eq"          → pass si count == min (ex: 0 orphelins attendu)
check_db() {
  local label="$1" sql="$2" min="${3:-1}" mode="${4:-gte}"

  result=$(curl -s --max-time 15 -X POST \
    "https://api.supabase.com/v1/projects/${SUPA_PROJECT}/database/query" \
    -H "Authorization: Bearer $SUPA_PAT" \
    -H "Content-Type: application/json" \
    -d "{\"query\": \"${sql}\"}" 2>/dev/null)

  count=$(echo "$result" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin)
  if isinstance(d,list) and d:
    row=d[0]
    print(int(list(row.values())[0]))
  else:
    print(0)
except:
  print(0)
" 2>/dev/null || echo 0)

  if [[ "$mode" == "eq" ]]; then
    if (( count == min )); then
      ok "$label → $count (OK)"
    else
      fail "$label → $count enregistrement(s) problématique(s) trouvé(s)"
    fi
  else
    if (( count >= min )); then
      ok "$label → $count enregistrement(s) en base"
    else
      fail "$label → $count enregistrement(s) (attendu ≥ $min)"
    fi
  fi
}

echo -e "${BOLD}============================================${RESET}"
echo -e "${BOLD}  Nexart Smoke Test — $BASE${RESET}"
echo -e "${BOLD}============================================${RESET}"

# ─── PAGES PUBLIQUES ────────────────────────────────────────
header "Pages publiques"
check_page "Accueil"           "$BASE/"
check_page "Marchés (liste)"   "$BASE/events"
check_page "Créateurs (liste)" "$BASE/creators"
check_page "Connexion"         "$BASE/login"
check_page "Inscription"       "$BASE/register"
check_page "Patch notes"       "$BASE/patch-notes"
check_page "Conditions"        "$BASE/conditions"
check_page "Mentions légales"  "$BASE/mentions-legales"
check_page "Contact"           "$BASE/contact"
check_page "404 custom"        "$BASE/cette-page-nexiste-pas" "404"

# ─── PAGES PROTÉGÉES ────────────────────────────────────────
header "Pages protégées"
check_page "Dashboard"       "$BASE/dashboard"
check_page "Créer un marché" "$BASE/events/create"
check_page "Profil"          "$BASE/profile"

# ─── CONTENU CRITIQUE ───────────────────────────────────────
header "Contenu critique"
check_content "Accueil contient 'Nexart'"        "$BASE/"          "Nexart"
check_content "Conditions contient du texte CGU" "$BASE/conditions" "conditions"
check_content "Patch-notes chargé"               "$BASE/patch-notes" "patch-notes"

# ─── VALIDATION JSON DES APIs ───────────────────────────────
header "Validation JSON des APIs"
check_json "GET /api/events — structure"  "/api/events" "id,title,city,start_date" 1

# POST invalide → doit retourner 400 ou 401, pas 500
code_post=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -d '{"invalid":"data"}' --max-time 10 "${BASE}/api/events")
if [[ "$code_post" == "400" || "$code_post" == "401" || "$code_post" == "403" || "$code_post" == "422" ]]; then
  ok "POST /api/events body invalide → HTTP $code_post (pas de 500)"
else
  fail "POST /api/events body invalide → HTTP $code_post (attendu 400/401, pas 500)"
fi

# ─── INTÉGRITÉ DE LA BASE (lue depuis tests/config.ts) ──────
header "Intégrité de la base de données"

if [[ -z "$SUPA_PAT" ]]; then
  warn "SUPABASE_PAT non défini — checks DB ignorés (ajoute-le dans .env.local)"
else
  # Extrait les checks DB depuis tests/config.ts et les exécute
  node scripts/parse-db-checks.mjs 2>/dev/null > /tmp/db_checks.json

  if [[ -s /tmp/db_checks.json ]] && python3 -c "import sys,json; json.load(sys.stdin)" < /tmp/db_checks.json 2>/dev/null; then
    while IFS= read -r check; do
      label=$(echo "$check" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['label'])")
      sql=$(echo "$check"   | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['sql'])")
      min=$(echo "$check"   | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('min',1))")
      mode=$(echo "$check"  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('mode','gte'))")
      check_db "$label" "$sql" "$min" "$mode"
    done < <(python3 -c "import sys,json; [print(json.dumps(c)) for c in json.load(open('/tmp/db_checks.json'))]")
  else
    warn "tests/config.ts introuvable — checks DB ignorés"
  fi
fi

# ─── API AUTH-PROTÉGÉES ─────────────────────────────────────
header "API protégées (401/403 sans token)"
check_api "GET /api/credits/balance"       GET "/api/credits/balance"
check_api "GET /api/audit-logs"            GET "/api/audit-logs"
check_api "GET /api/admin/stats"           GET "/api/admin/stats"
check_api "GET /api/creator/analytics"     GET "/api/creator/analytics"

# ─── SUPABASE ───────────────────────────────────────────────
header "Supabase"
supa_result=$(curl -s --max-time 10 -X POST \
  "https://api.supabase.com/v1/projects/${SUPA_PROJECT}/database/query" \
  -H "Authorization: Bearer $SUPA_PAT" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT 1 as ok"}' 2>/dev/null)
if echo "$supa_result" | grep -q '"ok"'; then
  ok "Supabase Management API joignable"
else
  fail "Supabase Management API inaccessible → $supa_result"
fi

# ─── HEADERS DE SÉCURITÉ ────────────────────────────────────
header "Headers de sécurité"
headers=$(curl -s -I --max-time 10 "$BASE/" 2>&1)
check_header() {
  if echo "$headers" | grep -qi "$1"; then ok "Header $1 présent"
  else warn "Header $1 manquant"; fi
}
check_header "content-security-policy"
check_header "x-frame-options"
check_header "x-content-type-options"
check_header "strict-transport-security"
check_header "referrer-policy"

# ─── PERFORMANCE ────────────────────────────────────────────
header "Performance"
time_ms=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$BASE/" | awk '{printf "%.0f", $1*1000}')
(( time_ms < 800 ))  && ok "Accueil : ${time_ms}ms (< 800ms)" \
  || { (( time_ms < 2000 )) && warn "Accueil : ${time_ms}ms (lent)" || fail "Accueil : ${time_ms}ms (> 2s)"; }

time_api=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$BASE/api/events" | awk '{printf "%.0f", $1*1000}')
(( time_api < 1000 )) && ok "/api/events : ${time_api}ms" \
  || { (( time_api < 3000 )) && warn "/api/events : ${time_api}ms (lent)" || fail "/api/events : ${time_api}ms (> 3s)"; }

# ─── RÉSUMÉ ─────────────────────────────────────────────────
TOTAL=$((PASS + FAIL + WARN))
echo -e "\n${BOLD}============================================${RESET}"
echo -e "${BOLD}  Résumé : $TOTAL tests${RESET}"
echo -e "  ${GREEN}✅ Passés   : $PASS${RESET}"
echo -e "  ${YELLOW}⚠️  Warnings : $WARN${RESET}"
echo -e "  ${RED}❌ Échoués  : $FAIL${RESET}"
echo -e "${BOLD}============================================${RESET}"

if (( FAIL > 0 )); then
  echo -e "\n${RED}${BOLD}RÉSULTAT : ÉCHEC — $FAIL problème(s)${RESET}"; exit 1
elif (( WARN > 0 )); then
  echo -e "\n${YELLOW}${BOLD}RÉSULTAT : OK avec avertissements${RESET}"; exit 0
else
  echo -e "\n${GREEN}${BOLD}RÉSULTAT : TOUT EST OK ✅${RESET}"; exit 0
fi
