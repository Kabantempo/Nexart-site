#!/bin/bash
set -e

SSH_KEY="$HOME/.ssh/hostinger_nexart"
SSH="ssh -i $SSH_KEY -p 65002"
REMOTE="u142938038@147.79.103.73"
TARGET="$REMOTE:~/domains/nexart.fr/nodejs"

echo "▶ Build..."
RAYON_NUM_THREADS=1 NEXT_CPU_CPUS=1 npm run build

echo "▶ Deploy standalone..."
rsync -az --delete -e "$SSH" .next/standalone/ $TARGET/

echo "▶ Deploy static assets..."
rsync -az -e "$SSH" .next/static/ $TARGET/.next/static/

echo "▶ Deploy public..."
rsync -az -e "$SSH" public/ $TARGET/public/

echo "▶ Envoi .env.local..."
scp -i $SSH_KEY -P 65002 .env.local $REMOTE:~/domains/nexart.fr/nodejs/.env.local

echo "▶ Restart Passenger..."
$SSH $REMOTE "touch ~/domains/nexart.fr/nodejs/tmp/restart.txt"

echo "▶ Health check..."
sleep 3
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://nexart.fr/api/health)
if [ "$STATUS" = "200" ]; then
  echo "✅ Deploy OK — nexart.fr répond 200"
else
  echo "⚠️  Health check retourné $STATUS"
fi
