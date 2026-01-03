#!/bin/bash

# ===================================
# 🔄 UPDATE SCRIPT - Floral Shop
# ===================================

set -e  # Exit on error

echo "🔄 Bắt đầu update..."

# 1. Backup database
echo "💾 Backup database..."
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

if [ -f "database.json" ]; then
    cp database.json "$BACKUP_DIR/database_$TIMESTAMP.json"
    echo "✅ Đã backup database.json"
fi

if [ -d "uploads" ]; then
    tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" uploads/
    echo "✅ Đã backup uploads/"
fi

# Giữ lại 5 bản backup gần nhất
ls -t $BACKUP_DIR/database_*.json 2>/dev/null | tail -n +6 | xargs -r rm
ls -t $BACKUP_DIR/uploads_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm

# 2. Pull code mới (nếu dùng Git)
if [ -d ".git" ]; then
    echo "📥 Pull code mới từ Git..."
    git pull
else
    echo "⚠️  Không phải Git repo, bỏ qua pull"
fi

# 3. Cài dependencies mới
echo "📦 Cài đặt dependencies..."
npm install

# 4. Build lại frontend
echo "🔨 Build frontend..."
npm run build

# 5. Restart backend
echo "🔄 Restart backend..."
pm2 restart floral-backend

# 6. Reload Nginx
echo "🌐 Reload Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ ================================"
echo "✅ UPDATE THÀNH CÔNG!"
echo "✅ ================================"
echo ""
echo "💾 Backup được lưu tại: $BACKUP_DIR/"
echo "📊 Backend status:"
pm2 status
echo ""
echo "🌐 Website đã được cập nhật!"
echo ""
