#!/bin/bash

# Vérifier health process avant deploy

export PATH="/opt/alt/alt-nodejs24/root/usr/bin:$PATH"

echo "📊 Process Health Check"
echo "========================"

# Compter process Node/npm
NODE_PROCESSES=$(ps aux | grep -E "node|npm|nexart" | grep -v grep | wc -l)
echo "Node processes actifs: $NODE_PROCESSES"

# Vérifier PM2 status
echo ""
echo "PM2 Status:"
pm2 status 2>/dev/null || echo "PM2 not initialized"

# Memory usage
echo ""
echo "Memory usage:"
ps aux | grep nexart-site | grep -v grep | awk '{print "CPU: " $3 "%, Memory: " $6 "KB"}'

# Check if app responding
echo ""
echo "App status:"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000; then
  echo " ✅ App responding"
else
  echo " ❌ App not responding (503?)"
fi

# Alert if too many processes
if [ $NODE_PROCESSES -gt 5 ]; then
  echo ""
  echo "⚠️  WARNING: Too many Node processes ($NODE_PROCESSES)"
  echo "Run: pm2 kill && sleep 2 && ./deploy-safe.sh"
fi
