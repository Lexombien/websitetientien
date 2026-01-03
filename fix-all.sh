#!/bin/bash

# ===================================
# 🔧 FIX ALL SCRIPT - Floral Shop
# ===================================
# Script tự động fix các lỗi thường gặp

set -e  # Exit on error

echo "🔧 BẮT ĐẦU FIX TẤT CẢ CÁC VẤN ĐỀ..."
echo "================================"
echo ""

# Lấy đường dẫn hiện tại
CURRENT_DIR=$(pwd)

# 1. Build frontend
echo "📦 1. BUILD FRONTEND..."
echo "----------------------------"
if [ -f "package.json" ]; then
    npm run build
    echo "✅ Đã build frontend"
else
    echo "❌ Không tìm thấy package.json!"
    exit 1
fi
echo ""

# 2. Kiểm tra dist folder
echo "📁 2. KIỂM TRA DIST FOLDER..."
echo "----------------------------"
if [ -f "dist/index.html" ]; then
    echo "✅ File dist/index.html tồn tại"
    ls -lh dist/index.html
else
    echo "❌ Build failed! Không tìm thấy dist/index.html"
    exit 1
fi
echo ""

# 3. Setup PM2
echo "⚙️  3. SETUP PM2..."
echo "----------------------------"

# Tạo logs folder
mkdir -p logs

# Tạo ecosystem.config.cjs nếu chưa có
if [ ! -f "ecosystem.config.cjs" ]; then
    cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'floral-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      HOST: '0.0.0.0'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
EOF
    echo "✅ Đã tạo ecosystem.config.cjs"
fi

# Restart PM2
pm2 delete floral-backend 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
echo "✅ PM2 đã khởi động"
echo ""

# 4. Cấu hình Nginx
echo "🌐 4. CẤU HÌNH NGINX..."
echo "----------------------------"

sudo tee /etc/nginx/sites-available/floral-shop > /dev/null << EOF
server {
    listen 80;
    server_name _;

    # Frontend (static files)
    location / {
        root $CURRENT_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Uploads folder
    location /uploads/ {
        alias $CURRENT_DIR/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
EOF

echo "✅ Đã tạo Nginx config"

# Enable site
sudo ln -sf /etc/nginx/sites-available/floral-shop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
echo "✅ Đã enable site"

# Test Nginx config
echo ""
echo "Testing Nginx config..."
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
echo "✅ Đã reload Nginx"
echo ""

# 5. Cấu hình Firewall
echo "🔥 5. CẤU HÌNH FIREWALL..."
echo "----------------------------"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
echo "✅ Đã mở firewall"
echo ""

# 6. Kiểm tra
echo "🧪 6. KIỂM TRA HỆ THỐNG..."
echo "----------------------------"

echo "PM2 Status:"
pm2 status

echo ""
echo "Nginx Status:"
sudo systemctl status nginx --no-pager | head -10

echo ""
echo "Test localhost:"
curl -I http://localhost 2>&1 | head -5

echo ""
echo "Test backend:"
curl -s http://localhost:3001/api/ping

echo ""

# 7. Tóm tắt
echo "================================"
echo "✅ FIX HOÀN TẤT!"
echo "================================"
echo ""
echo "📊 Thông tin:"
echo "   - Frontend: $CURRENT_DIR/dist"
echo "   - Backend: PM2 running on port 3001"
echo "   - Nginx: Serving on port 80"
echo ""
echo "🌐 Truy cập website:"
echo "   - Frontend: http://YOUR_VPS_IP"
echo "   - Admin: http://YOUR_VPS_IP/#admin"
echo ""
echo "📝 Các lệnh hữu ích:"
echo "   - Xem logs backend: pm2 logs floral-backend"
echo "   - Xem logs Nginx: sudo tail -f /var/log/nginx/error.log"
echo "   - Restart backend: pm2 restart floral-backend"
echo "   - Reload Nginx: sudo systemctl reload nginx"
echo ""
echo "🔍 Nếu vẫn không hoạt động, chạy:"
echo "   bash debug.sh"
echo ""
