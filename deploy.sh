#!/bin/bash
# Deploy to Hostinger — run from project root after `npm run build`
set -e

REMOTE_DIR="/home/u142938038/domains/nexart.fr/nodejs"
SSH_KEY="~/.ssh/hostinger_nexart"
SSH_HOST="u142938038@147.79.103.73"
SSH_PORT="65002"
ARCHIVE="/tmp/nexart-deploy-$(date +%s).tar.gz"

echo "📦 Building archive..."
tar -czf "$ARCHIVE" .next package.json package-lock.json

echo "⬆️  Uploading to Hostinger..."
scp -P $SSH_PORT -i $SSH_KEY "$ARCHIVE" "$SSH_HOST:$REMOTE_DIR/"

REMOTE_ARCHIVE=$(basename $ARCHIVE)

echo "🚀 Deploying on server..."
ssh -i $SSH_KEY -p $SSH_PORT $SSH_HOST "
  cd $REMOTE_DIR
  rm -rf .next.bak 2>/dev/null
  mv .next .next.bak 2>/dev/null || true
  tar -xzf $REMOTE_ARCHIVE
  rm -f $REMOTE_ARCHIVE
  # Neutralise le build hPanel (il ne peut pas compiler sur le serveur)
  /opt/alt/alt-nodejs20/root/usr/bin/node -e \"const fs=require('fs'); const p=JSON.parse(fs.readFileSync('package.json','utf8')); p.scripts.build='echo Build skipped - pre-built locally'; fs.writeFileSync('package.json', JSON.stringify(p,null,2))\"
  touch tmp/restart.txt
  echo 'BUILD_ID:' \$(cat .next/BUILD_ID)
"

echo "🧹 Cleaning up local archive..."
rm -f "$ARCHIVE"

echo "✅ Done! Waiting for restart..."
sleep 8
curl -s -o /dev/null -w "HTTP status: %{http_code}\n" https://nexart.fr
