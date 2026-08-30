#!/bin/bash
set -e

SSH_KEY="$HOME/.ssh/hostinger_nexart"
SSH_CMD="ssh -i $SSH_KEY -p 65002 -o StrictHostKeyChecking=no"
SCP_CMD="scp -i $SSH_KEY -P 65002 -o StrictHostKeyChecking=no"
REMOTE="u142938038@147.79.103.73"
REMOTE_DIR="~/domains/nexart.fr/nodejs"

echo "▶ Build..."
npx next build

echo "▶ Fix chemins Windows→Linux..."
node scripts/fix-paths.js

echo "▶ Compression..."
tar -czf /tmp/nexart-deploy.tar.gz --exclude="*.map" -C .next/standalone .
tar -czf /tmp/nexart-static.tar.gz -C .next/static .
tar -czf /tmp/nexart-public.tar.gz -C public .

echo "▶ Transfert..."
$SCP_CMD /tmp/nexart-deploy.tar.gz $REMOTE:/tmp/nexart-deploy.tar.gz
$SCP_CMD /tmp/nexart-static.tar.gz $REMOTE:/tmp/nexart-static.tar.gz
$SCP_CMD /tmp/nexart-public.tar.gz $REMOTE:/tmp/nexart-public.tar.gz

echo "▶ Extraction..."
$SSH_CMD $REMOTE "
  set -e
  cd $REMOTE_DIR
  tar -xzf /tmp/nexart-deploy.tar.gz
  mkdir -p .next/static && tar -xzf /tmp/nexart-static.tar.gz -C .next/static
  mkdir -p public && tar -xzf /tmp/nexart-public.tar.gz -C public
  rm -f /tmp/nexart-deploy.tar.gz /tmp/nexart-static.tar.gz /tmp/nexart-public.tar.gz
"

echo "▶ Envoi .env.local..."
$SCP_CMD .env.local $REMOTE:$REMOTE_DIR/.env.local

echo "▶ Restart Passenger..."
$SSH_CMD $REMOTE "mkdir -p $REMOTE_DIR/tmp && touch $REMOTE_DIR/tmp/restart.txt"

rm -f /tmp/nexart-deploy.tar.gz /tmp/nexart-static.tar.gz /tmp/nexart-public.tar.gz

echo "▶ Health check..."
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://nexart.fr/api/health)
if [ "$STATUS" = "200" ]; then
  echo "✅ Deploy OK — nexart.fr répond 200"
else
  echo "⚠️  Health check retourné $STATUS"
fi
