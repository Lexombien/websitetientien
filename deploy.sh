#!/bin/bash

# ===================================
# 🚀 DEPLOY SCRIPT - Floral Shop
# ===================================

set -e  # Exit on error

echo "🚀 Bắt đầu deploy..."

# 1. Cài dependencies
echo "📦 Cài đặt dependencies..."
npm install

# 2. Build frontend
echo "🔨 Build frontend..."
npm run build

# 3. Setup PM2 cho backend
echo "⚙️  Cấu hình PM2..."

# Tạo file ecosystem.config.js cho PM2
cat > ecosystem.config.js << 'EOF'
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

# Tạo folder logs
mkdir -p logs

# Stop PM2 nếu đang chạy
pm2 delete floral-backend 2>/dev/null || true

# Start PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 4. Cấu hình Nginx
echo "🌐 Cấu hình Nginx..."

# Lấy đường dẫn hiện tại
CURRENT_DIR=$(pwd)

# Tạo Nginx config
sudo tee /etc/nginx/sites-available/floral-shop > /dev/null << EOF
server {
    listen 80;
    server_name _;  # Chấp nhận tất cả domain/IP

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

# Enable site
sudo ln -sf /etc/nginx/sites-available/floral-shop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test và reload Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx

# 5. Cấu hình Firewall
echo "🔥 Cấu hình firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (cho sau này)
sudo ufw --force enable

echo ""
echo "✅ ================================"
echo "✅ DEPLOY THÀNH CÔNG!"
echo "✅ ================================"
echo ""
echo "📊 Thông tin:"
echo "   - Backend: PM2 running on port 3001"
echo "   - Frontend: Nginx serving from /dist"
echo "   - Uploads: $CURRENT_DIR/uploads"
echo ""
echo "🌐 Truy cập website:"
echo "   - Frontend: http://YOUR_VPS_IP"
echo "   - Admin: http://YOUR_VPS_IP/#admin"
echo ""
echo "📝 Các lệnh hữu ích:"
echo "   - Xem logs backend: pm2 logs floral-backend"
echo "   - Restart backend: pm2 restart floral-backend"
echo "   - Xem status: pm2 status"
echo "   - Reload Nginx: sudo systemctl reload nginx"
echo ""
