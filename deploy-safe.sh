#!/bin/bash

# Deploy sécurisé pour éviter max processes

export PATH="/opt/alt/alt-nodejs24/root/usr/bin:$PATH"
cd /home/u142938038/nexart-site

echo "🚀 Déploiement sécurisé..."

# 1. Tuer TOUTES les anciennes instances
echo "🛑 Arrêt de l'app..."
pm2 delete nexart-site 2>/dev/null || true
sleep 2

# 2. Vérifier que aucun process reste
echo "✅ Vérification process..."
ps aux | grep -i "node\|npm" | grep -v grep | awk '{print $2}' | xargs -r kill -9 2>/dev/null || true
sleep 1

# 3. Build
echo "🔨 Build..."
npm run build 2>&1 | tail -5

# 4. Lancer avec PM2 config
echo "🚀 Lancement avec PM2..."
pm2 start ecosystem.config.js --env production

# 5. Verify
echo "✅ Status:"
pm2 status

echo "📝 Logs (dernières 5 lignes):"
pm2 logs nexart-site --lines 5 --nostream

echo "✅ Deploy réussi!"
