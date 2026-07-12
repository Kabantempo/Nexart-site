#!/bin/bash
# Deploy to Hostinger — compile locally, push standalone only
# Usage: ./deploy.sh
set -e

REMOTE_DIR="/home/u142938038/domains/nexart.fr/nodejs"
SSH_KEY="$HOME/.ssh/hostinger_nexart"
SSH_HOST="u142938038@147.79.103.73"
SSH_PORT="65002"
SSH="ssh -i $SSH_KEY -p $SSH_PORT $SSH_HOST"
ARCHIVE="/tmp/nexart-deploy-$(date +%s).tar.gz"

# ── 1. Build local ────────────────────────────────────────────────────────────
echo "🔨 Building locally..."
npm run build

# ── 2. Archive standalone seulement (~50MB vs ~500MB avant) ──────────────────
echo "📦 Creating archive (standalone only)..."
tar -czf "$ARCHIVE" \
  .next/standalone \
  .next/static \
  public

ARCHIVE_SIZE=$(du -sh "$ARCHIVE" | cut -f1)
echo "   Archive size: $ARCHIVE_SIZE"

# ── 3. Upload ─────────────────────────────────────────────────────────────────
echo "⬆️  Uploading to Hostinger..."
scp -P "$SSH_PORT" -i "$SSH_KEY" "$ARCHIVE" "$SSH_HOST:/tmp/"

REMOTE_ARCHIVE="/tmp/$(basename $ARCHIVE)"

# ── 4. Extract + patch + restart ─────────────────────────────────────────────
echo "🚀 Deploying on server..."
$SSH "
  set -e
  cd $REMOTE_DIR

  # Backup current standalone
  rm -rf .next.bak 2>/dev/null || true
  [ -d .next/standalone ] && cp -r .next/standalone .next.bak 2>/dev/null || true

  # Extract new build
  tar -xzf $REMOTE_ARCHIVE
  rm -f $REMOTE_ARCHIVE

  # Copy static assets into standalone (required by Next.js standalone)
  cp -r .next/static .next/standalone/.next/static
  cp -r public .next/standalone/public 2>/dev/null || true

  # Neutralise hPanel build script (it can't compile on server)
  node -e \"const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); p.scripts.build='echo Build skipped - pre-built locally'; fs.writeFileSync('package.json', JSON.stringify(p,null,2))\" 2>/dev/null || true

  # Restart app
  touch tmp/restart.txt

  echo 'BUILD_ID:' \$(cat .next/standalone/.next/BUILD_ID 2>/dev/null || cat .next/BUILD_ID 2>/dev/null || echo unknown)
"

echo "🧹 Cleaning up local archive..."
rm -f "$ARCHIVE"

# ── 5. Attendre le restart puis vérifier ─────────────────────────────────────
echo "⏳ Waiting for app restart (15s)..."
sleep 15

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://nexart.fr)
echo "🌐 HTTP status: $HTTP_CODE"

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Site returned $HTTP_CODE — checking server logs..."
  $SSH "tail -40 $REMOTE_DIR/console.log 2>/dev/null || echo '(no console.log)'"
  echo ""
  $SSH "cat $REMOTE_DIR/stderr.log 2>/dev/null || echo '(no stderr.log)'"
  echo ""
  echo "⚠️  Deploy failed — rolling back..."
  $SSH "
    cd $REMOTE_DIR
    if [ -d .next.bak ]; then
      rm -rf .next/standalone
      mv .next.bak .next/standalone
      touch tmp/restart.txt
      echo 'Rollback done'
    else
      echo 'No backup to rollback to'
    fi
  "
  sleep 8
  HTTP_CODE2=$(curl -s -o /dev/null -w "%{http_code}" https://nexart.fr)
  echo "🌐 After rollback: HTTP $HTTP_CODE2"
  exit 1
fi

echo ""
echo "✅ Deploy successful — site is up (HTTP $HTTP_CODE)"

# ── 6. Vérification logs (cherche erreurs critiques) ─────────────────────────
echo ""
echo "📋 Checking server logs for errors..."
LOG_ERRORS=$($SSH "tail -30 $REMOTE_DIR/console.log 2>/dev/null | grep -i 'error\|crash\|undefined\|ENOENT' || echo ''" 2>/dev/null)

if [ -n "$LOG_ERRORS" ]; then
  echo "⚠️  Errors found in console.log:"
  echo "$LOG_ERRORS"
else
  echo "✅ No errors in recent logs"
fi

STDERR=$($SSH "cat $REMOTE_DIR/stderr.log 2>/dev/null" 2>/dev/null)
if [ -n "$STDERR" ]; then
  echo "⚠️  stderr.log is not empty:"
  echo "$STDERR"
else
  echo "✅ stderr.log is clean"
fi
