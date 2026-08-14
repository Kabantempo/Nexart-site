#!/bin/bash
# ============================================================
# Nexart — Uptime Monitor
# Vérifie que nexart.fr répond et envoie un email via Resend si c'est down
#
# Setup sur Hostinger (cron) :
#   */5 * * * * bash ~/nexart-site/scripts/uptime-monitor.sh >> ~/uptime.log 2>&1
# ============================================================

BASE="https://nexart.fr"
RESEND_KEY="${RESEND_API_KEY:-}"
ALERT_EMAIL="kalvinpaviel4@gmail.com"
STATE_FILE="/tmp/nexart_uptime_state"

check_url() {
  curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$1"
}

send_alert() {
  local subject="$1" body="$2"
  if [[ -z "$RESEND_KEY" ]]; then
    echo "[$(date)] ALERT: $subject (Resend non configuré)"
    return
  fi
  curl -s -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $RESEND_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"from\": \"monitor@nexart.fr\",
      \"to\": [\"$ALERT_EMAIL\"],
      \"subject\": \"$subject\",
      \"html\": \"<p>$body</p><p><small>$(date)</small></p>\"
    }" > /dev/null
}

# ─── Checks ─────────────────────────────────────────────────
code_home=$(check_url "$BASE/")
code_api=$(check_url "$BASE/api/events")

PREV_STATE=$(cat "$STATE_FILE" 2>/dev/null || echo "up")

if [[ "$code_home" != "200" ]] || [[ "$code_api" != "200" ]]; then
  echo "[$(date)] DOWN — home:$code_home api:$code_api"

  # N'envoie l'alerte que si le site vient de tomber (évite les doublons)
  if [[ "$PREV_STATE" == "up" ]]; then
    send_alert \
      "🔴 Nexart est DOWN" \
      "nexart.fr ne répond plus.<br>Home: HTTP $code_home<br>API: HTTP $code_api<br>Vérifier: <a href='$BASE'>$BASE</a>"
  fi

  echo "down" > "$STATE_FILE"
else
  echo "[$(date)] UP — home:$code_home api:$code_api"

  # Envoie une alerte de rétablissement si le site était down
  if [[ "$PREV_STATE" == "down" ]]; then
    send_alert \
      "🟢 Nexart est de nouveau UP" \
      "nexart.fr répond correctement.<br>Home: HTTP $code_home<br>API: HTTP $code_api"
  fi

  echo "up" > "$STATE_FILE"
fi
