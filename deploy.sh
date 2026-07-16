#!/bin/bash
# Deploy to Hostinger — compile locally, push standalone only
# Usage: ./deploy.sh
set -e

REMOTE_DIR="/home/u142938038/domains/nexart.fr/nodejs"
SSH_KEY="$HOME/.ssh/hostinger_nexart"
SSH_HOST="u142938038@147.79.103.73"
SSH_PORT="65002"
# -o ServerAliveInterval=5 évite le timeout SSH sur les commandes longues
SSH="ssh -i $SSH_KEY -p $SSH_PORT -o ServerAliveInterval=5 $SSH_HOST"
ARCHIVE="/tmp/nexart-deploy-$(date +%s).tar.gz"

# ── 1. Build local ────────────────────────────────────────────────────────────
echo "🔨 Building locally..."
npm run build:local

# ── 2. Archive standalone seulement (~10MB vs ~500MB avec node_modules) ───────
echo "📦 Creating archive (standalone only)..."
tar -czf "$ARCHIVE" .next/standalone .next/static public
ARCHIVE_SIZE=$(du -sh "$ARCHIVE" | cut -f1)
echo "   Archive size: $ARCHIVE_SIZE"

# ── 3. Upload ─────────────────────────────────────────────────────────────────
echo "⬆️  Uploading to Hostinger..."
scp -P "$SSH_PORT" -i "$SSH_KEY" -o ServerAliveInterval=5 -o ServerAliveCountMax=20 "$ARCHIVE" "$SSH_HOST:/tmp/"
REMOTE_ARCHIVE="/tmp/$(basename $ARCHIVE)"

# ── 4. Kill stale processes (évite 503 max process limit) ────────────────────
echo "🔪 Killing stale node processes..."
$SSH "pkill -f 'node.*server.js' 2>/dev/null; pkill -f 'node.*next' 2>/dev/null; echo done" || true
sleep 3

# ── 5. Extract ────────────────────────────────────────────────────────────────
echo "📂 Extracting build..."
$SSH "cd $REMOTE_DIR && tar -xzf $REMOTE_ARCHIVE && rm -f $REMOTE_ARCHIVE && echo done"

# ── 6. Copier static dans standalone (requis par Next.js) ────────────────────
echo "🔗 Linking static assets..."
$SSH "cd $REMOTE_DIR && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public && [ -f .env.local ] && cp .env.local .next/standalone/.env.local; echo done"

# ── 7. Clear stderr + restart ─────────────────────────────────────────────────
echo "🚀 Restarting app..."
$SSH "cd $REMOTE_DIR && > stderr.log && touch tmp/restart.txt && cat .next/standalone/.next/BUILD_ID"

echo "🧹 Cleaning up local archive..."
rm -f "$ARCHIVE"

# ── 8. Vérifier HTTP 200 ──────────────────────────────────────────────────────
echo "⏳ Waiting for restart (15s)..."
sleep 15

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://nexart.fr)
echo "🌐 HTTP status: $HTTP_CODE"

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Site returned $HTTP_CODE — server logs:"
  $SSH "tail -40 $REMOTE_DIR/console.log 2>/dev/null"
  $SSH "cat $REMOTE_DIR/stderr.log 2>/dev/null"
  echo ""
  echo "⚠️  Rolling back..."
  $SSH "cd $REMOTE_DIR && [ -d .next.bak ] && rm -rf .next/standalone && mv .next.bak .next/standalone && touch tmp/restart.txt && echo 'Rollback done' || echo 'No backup'"
  sleep 8
  HTTP_CODE2=$(curl -s -o /dev/null -w "%{http_code}" https://nexart.fr)
  echo "🌐 After rollback: HTTP $HTTP_CODE2"
  exit 1
fi

echo ""
echo "✅ Deploy successful — site up (HTTP $HTTP_CODE)"

# ── 9. Vérification logs erreurs ──────────────────────────────────────────────
echo ""
LOG_ERRORS=$($SSH "tail -20 $REMOTE_DIR/console.log 2>/dev/null | grep -i 'error\|crash\|ENOENT' || true")
[ -n "$LOG_ERRORS" ] && echo "⚠️  Errors in console.log:" && echo "$LOG_ERRORS" || echo "✅ No errors in logs"

STDERR=$($SSH "cat $REMOTE_DIR/stderr.log 2>/dev/null")
[ -n "$STDERR" ] && echo "⚠️  stderr.log:" && echo "$STDERR" || echo "✅ stderr.log clean"
