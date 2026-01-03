#!/bin/bash

# 🔄 Quick Update Script
# Run this after making code changes

echo "🔄 Updating Floral Shop..."

cd /var/www/floral-shop || exit

echo "📥 Pulling latest code..."
git pull

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building..."
npm run build

echo "♻️  Restarting backend..."
pm2 restart floral-backend

echo "🌐 Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "✅ Update complete!"
pm2 status
