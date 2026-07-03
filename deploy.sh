#!/bin/bash
# Deploy Nexart → Hostinger
# Avant de lancer : chmod +x deploy.sh
# Usage : ./deploy.sh

set -e

# ── CONFIG ─────────────────────────────────────────────────────────────────
SSH_USER="u142938038"
SSH_HOST="147.79.103.73"
SSH_PORT="65002"
SSH_KEY="$HOME/.ssh/hostinger_nexart"
REMOTE_DIR="~/domains/nexart.fr/nodejs"
# ───────────────────────────────────────────────────────────────────────────

echo "📦 Build local..."
RAYON_NUM_THREADS=1 NEXT_CPU_CPUS=1 npm run build

echo "📁 Préparation du bundle standalone..."
# Copier les assets statiques dans le dossier standalone
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

echo "🚀 Envoi sur Hostinger..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  -e "ssh -p $SSH_PORT -i $SSH_KEY" \
  .next/standalone/ \
  "$SSH_USER@$SSH_HOST:$REMOTE_DIR/"

echo "♻️  Redémarrage de l'app Node.js..."
ssh -p "$SSH_PORT" -i "$SSH_KEY" "$SSH_USER@$SSH_HOST" \
  "touch $REMOTE_DIR/tmp/restart.txt"

echo "✅ Déployé sur https://nexart.fr"
