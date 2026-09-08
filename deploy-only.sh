#!/bin/bash
# Deploy to Hostinger — build already done locally (via PowerShell), just push
# Usage:  bash deploy-only.sh
# Build first with PowerShell:  $env:NEXT_TELEMETRY_DISABLED=1; npx next build
set -e

REMOTE_DIR="/home/u142938038/domains/nexart.fr/nodejs"
SSH_KEY="$HOME/.ssh/hostinger_nexart"
SSH_HOST="u142938038@147.79.103.73"
SSH_PORT="65002"
SSH="ssh -i $SSH_KEY -p $SSH_PORT -o ServerAliveInterval=10 -o ServerAliveCountMax=60 $SSH_HOST"
ARCHIVE="/tmp/nexart-$(date +%s).tar.gz"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── 1. Fix Windows backslash paths ───────────────────────────────────────────
echo "🔧 Fixing Windows path separators..."
node - <<'FIXEOF'
const fs = require('fs'), path = require('path');
let count = 0;
function fixFile(p) {
  const b = path.basename(p);
  if (b.endsWith('_client-reference-manifest.js')) return;
  const c = fs.readFileSync(p, 'utf8');
  const f = c.replace(/next\/dist((?:\\\\[a-zA-Z0-9._\-]+)+(?:\.js)?)/g, (m, rest) => 'next/dist/' + rest.replace(/\\\\/g, '/').replace(/^\//, ''));
  if (f !== c) { fs.writeFileSync(p, f); count++; }
}
function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.js')) fixFile(p);
  }
}
walk('.next/standalone/.next/server');
walk('.next/server');
console.log(`  Fixed ${count} files`);
FIXEOF

# ── 2. Archive ────────────────────────────────────────────────────────────────
echo "📦 Creating archive..."
DEPLOY_TMP=$(mktemp -d)
mkdir -p "$DEPLOY_TMP/.next"
cp -r .next/standalone/. "$DEPLOY_TMP/"
cp -r .next/static "$DEPLOY_TMP/.next/"
cp -r public "$DEPLOY_TMP/"
tar -czf "$ARCHIVE" -C "$DEPLOY_TMP" .
rm -rf "$DEPLOY_TMP"
echo "   Size: $(du -sh "$ARCHIVE" | cut -f1)"

# ── 3. Upload ─────────────────────────────────────────────────────────────────
echo "⬆️  Uploading..."
scp -P "$SSH_PORT" -i "$SSH_KEY" -o ServerAliveInterval=10 -o ServerAliveCountMax=60 "$ARCHIVE" "$SSH_HOST:/tmp/nex_deploy.tar.gz"

# ── 4. Extract ────────────────────────────────────────────────────────────────
echo "📂 Extracting..."
$SSH "tar -xzf /tmp/nex_deploy.tar.gz -C $REMOTE_DIR && rm /tmp/nex_deploy.tar.gz && echo done"

# ── 5. Restart ────────────────────────────────────────────────────────────────
echo "🚀 Restarting..."
$SSH "cd $REMOTE_DIR && > stderr.log && pkill -f next-router-worker 2>/dev/null || true; mkdir -p tmp && touch tmp/restart.txt && cat .next/BUILD_ID"

rm -f "$ARCHIVE"

# ── 6. Verify ─────────────────────────────────────────────────────────────────
echo "⏳ Waiting 15s..."
sleep 15
HTTP=$(curl -s -o /dev/null -w "%{http_code}" https://nexart.fr)
echo "🌐 HTTP $HTTP"
[ "$HTTP" = "200" ] && echo "✅ Deploy OK" || { echo "❌ Site down — logs:"; $SSH "tail -30 $REMOTE_DIR/console.log 2>/dev/null"; exit 1; }
