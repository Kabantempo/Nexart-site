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

# ── 2. Fix Windows backslash paths in module requires (build on Windows → Linux) ──
echo "🔧 Fixing Windows path separators in server build..."
node - <<'FIXEOF'
const fs = require('fs');
const path = require('path');
let count = 0;

function fixModulePaths(content) {
  // File contains next/dist\\segment\\... (two raw backslashes per segment)
  return content.replace(/next\/dist((?:\\\\[a-zA-Z0-9._-]+)+)/g, (match, rest) => {
    return 'next/dist/' + rest.replace(/\\\\/g, '/').slice(1);
  });
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.js')) {
      const c = fs.readFileSync(p, 'utf8');
      const fixed = fixModulePaths(c);
      if (fixed !== c) { fs.writeFileSync(p, fixed); count++; }
    }
  });
}

walk('.next/standalone/.next/server');
walk('.next/server');
if (count > 0) console.log(`  Fixed ${count} files`);
else console.log('  No Windows paths found (build on Unix or already fixed)');
FIXEOF

# ── 3. Archive avec structure correcte pour hPanel ───────────────────────────
# hPanel lance nodejs/server.js qui cherche .next/server/ dans nodejs/.next/
# => standalone/* va à la racine de nodejs/, pas dans .next/standalone/
echo "📦 Creating archive (correct hPanel structure)..."
DEPLOY_TMP=$(mktemp -d)
mkdir -p "$DEPLOY_TMP/.next"
# Standalone contents → root (server.js, lib, node_modules, pages, .next/server/ etc.)
cp -r .next/standalone/. "$DEPLOY_TMP/"
# Static files → .next/static/ (LiteSpeed sert /_next/static/)
cp -r .next/static "$DEPLOY_TMP/.next/"
# Public
cp -r public "$DEPLOY_TMP/"
tar -czf "$ARCHIVE" -C "$DEPLOY_TMP" .
rm -rf "$DEPLOY_TMP"
ARCHIVE_SIZE=$(du -sh "$ARCHIVE" | cut -f1)
echo "   Archive size: $ARCHIVE_SIZE"

# ── 4. Upload ─────────────────────────────────────────────────────────────────
echo "⬆️  Uploading to Hostinger..."
scp -P "$SSH_PORT" -i "$SSH_KEY" -o ServerAliveInterval=5 -o ServerAliveCountMax=20 "$ARCHIVE" "$SSH_HOST:/tmp/"
REMOTE_ARCHIVE="/tmp/$(basename $ARCHIVE)"

# ── 5. Extract directly into nodejs/ ──────────────────────────────────────────
# tar -xzf dans nodejs/ écrase server.js et met .next/server/ au bon endroit
echo "📂 Extracting build..."
$SSH "tar -xzf $REMOTE_ARCHIVE -C $REMOTE_DIR && rm -f $REMOTE_ARCHIVE && echo done"

# ── 6b. Alias username → UUID static pages (username-based pretty URLs) ──────
$SSH "cd $REMOTE_DIR && CREATORS_DIR=.next/server/app/creators && for uuid_html in \$CREATORS_DIR/*.html; do uuid=\$(basename \$uuid_html .html); [ \"\$uuid\" = '_page' ] && continue; username=\$(curl -s \"https://cvqeysnymnkfxfithhsr.supabase.co/rest/v1/profiles?id=eq.\$uuid&select=username\" -H 'apikey: sb_publishable_Q59WmYgpYsdmW2pPRF6sfA_g2inbZei' -H 'Authorization: Bearer sb_publishable_Q59WmYgpYsdmW2pPRF6sfA_g2inbZei' -H 'Accept-Profile: public' 2>/dev/null | grep -o '\"username\":\"[^\"]*\"' | cut -d'\"' -f4); if [ -n \"\$username\" ] && [ \"\$username\" != 'null' ]; then cp \$CREATORS_DIR/\$uuid.html \$CREATORS_DIR/\$username.html 2>/dev/null; cp \$CREATORS_DIR/\$uuid.meta \$CREATORS_DIR/\$username.meta 2>/dev/null; cp \$CREATORS_DIR/\$uuid.rsc \$CREATORS_DIR/\$username.rsc 2>/dev/null; fi; done; echo 'username aliases done'"

# ── 7. Restart via hPanel (touch tmp/restart.txt) ────────────────────────────
echo "🚀 Restarting app..."
$SSH "cd $REMOTE_DIR && > stderr.log && pkill -f next-router-worker 2>/dev/null || true; touch tmp/restart.txt && cat .next/BUILD_ID"

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
