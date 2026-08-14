#!/bin/bash
# Exécute tous les tests et génère un rapport d'erreurs en Markdown

# Charge les variables d'environnement locales si disponibles
[ -f .env.local ] && export $(grep -v '^#' .env.local | xargs) 2>/dev/null

REPORT="test-results/report.md"
rm -f "$REPORT"
mkdir -p test-results
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
ERRORS=""
EXIT_CODE=0
FAIL_COUNT=0
PASS_COUNT=0

RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'
BOLD='\033[1m'; RESET='\033[0m'; YELLOW='\033[1;33m'

# ── ASCII Banner ──────────────────────────────────────────────
printf "\n${BOLD}${CYAN}"
cat << 'BANNER'
  _  __     _
 | |/ /    | |
 | ' / __ _| |__   __ _ _ __
 |  < / _` | '_ \ / _` | '_ \
 | . \ (_| | |_) | (_| | | | |
 |_|\_\__,_|_.__/ \__,_|_| |_|
BANNER
printf "${RESET}\n"

# ── Spinner ──────────────────────────────────────────────────
SPINNER_PID=""
spinner() {
  local label="$1"
  local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
  local i=0
  while true; do
    printf "\r  ${CYAN}${frames[$i]}${RESET}  %s..." "$label"
    i=$(( (i + 1) % ${#frames[@]} ))
    sleep 0.08
  done
}

spinner_start() { spinner "$1" & SPINNER_PID=$!; }
spinner_stop()  {
  if [[ -n "$SPINNER_PID" ]]; then
    kill "$SPINNER_PID" 2>/dev/null
    wait "$SPINNER_PID" 2>/dev/null
    SPINNER_PID=""
    printf "\r\033[2K"   # efface la ligne du spinner
  fi
}

# ── Runner ───────────────────────────────────────────────────
run() {
  local label="$1"
  shift
  spinner_start "$label"
  output=$("$@" 2>&1)
  code=$?
  spinner_stop

  if (( code != 0 )); then
    echo -e "  ${RED}✗${RESET}  ${BOLD}$label${RESET}"
    # Affiche uniquement les lignes d'erreur utiles
    echo "$output" | grep -E "FAIL|Error|✗|❌|failed|×|✅|⚠️" | sed 's/^/     /'
    EXIT_CODE=1
    ((FAIL_COUNT++))
    ERRORS="${ERRORS}
## ❌ $label

\`\`\`
$(echo "$output" | grep -E "FAIL|Error|✗|❌|failed|×" | head -30)
\`\`\`
"
  else
    echo -e "  ${GREEN}✓${RESET}  ${BOLD}$label${RESET}"
    echo "$output" | grep -E "✅|Passés|passed|OK" | tail -3 | sed 's/^/     /'
    ((PASS_COUNT++))
    ERRORS="${ERRORS}
## ✅ $label — OK
"
  fi
}

# ── Header ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║   Nexart — Suite de tests complète       ║${RESET}"
echo -e "${BOLD}${CYAN}║   $TIMESTAMP                       ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo ""

run "Healthcheck production" bash scripts/healthcheck.sh https://nexart.fr
echo ""
run "Tests E2E Playwright"   npx playwright test --reporter=line
echo ""
run "Audit performance"      node scripts/audit-performance.mjs

# ── Rapport Markdown ─────────────────────────────────────────
cat > "$REPORT" << EOF
# Rapport de tests Nexart
**Date** : $TIMESTAMP

$ERRORS
EOF

# ── Résumé ───────────────────────────────────────────────────
echo ""
TOTAL=$((PASS_COUNT + FAIL_COUNT))
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║${RESET}  Suites : ${GREEN}$PASS_COUNT passée(s)${RESET} / ${RED}$FAIL_COUNT échouée(s)${RESET} / $TOTAL total"
if (( EXIT_CODE == 0 )); then
  echo -e "${BOLD}${CYAN}║${RESET}  ${GREEN}${BOLD}RÉSULTAT : TOUT EST OK ✅${RESET}"
else
  echo -e "${BOLD}${CYAN}║${RESET}  ${RED}${BOLD}RÉSULTAT : $FAIL_COUNT SUITE(S) EN ERREUR ❌${RESET}"
  echo -e "${BOLD}${CYAN}║${RESET}  ${YELLOW}Rapport → $REPORT${RESET}"
fi
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo ""

cp "$REPORT" "$HOME/Desktop/nexart-test-report.md"
echo -e "  📄 Rapport copié sur le Bureau → ${BOLD}nexart-test-report.md${RESET}"
echo ""

exit $EXIT_CODE
