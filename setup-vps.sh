#!/bin/bash

# ===================================
# ⚙️  SETUP VPS - Floral Shop
# ===================================
# Script cài đặt môi trường VPS từ đầu
# Chỉ chạy 1 lần khi setup VPS mới

set -e  # Exit on error

echo "⚙️  Bắt đầu setup VPS..."

# 1. Update system
echo "📦 Update system packages..."
apt update && apt upgrade -y

# 2. Cài Node.js 22 LTS
echo "📦 Cài Node.js 22 LTS..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# 3. Cài các tools cần thiết
echo "📦 Cài Nginx, Git, PM2..."
apt install -y nginx git ufw

# 4. Cài PM2 global
npm install -g pm2@latest

# 5. Tạo thư mục project
echo "📁 Tạo thư mục project..."
mkdir -p /var/www/floral-shop

# 6. Cấu hình firewall cơ bản
echo "🔥 Cấu hình firewall..."
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

echo ""
echo "✅ ================================"
echo "✅ SETUP VPS THÀNH CÔNG!"
echo "✅ ================================"
echo ""
echo "📊 Kiểm tra version:"
node -v
npm -v
pm2 -v
nginx -v
echo ""
echo "📁 Thư mục project: /var/www/floral-shop"
echo ""
echo "🚀 Bước tiếp theo:"
echo "   1. Upload code vào /var/www/floral-shop"
echo "   2. Chạy: cd /var/www/floral-shop && bash deploy.sh"
echo ""
