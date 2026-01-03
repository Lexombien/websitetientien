# 🚀 Hướng Dẫn Deploy Lên Vultr VPS

## 📋 Chuẩn Bị

### Yêu cầu:
- ✅ Vultr VPS (Ubuntu 22.04 LTS khuyên dùng)
- ✅ Domain name (tùy chọn, nhưng khuyên dùng)
- ✅ SSH access vào VPS

### Thông tin VPS cần có:
- IP address của VPS
- SSH username (thường là `root`)
- SSH password hoặc private key

---

## 🔧 BƯỚC 1: Kết nối SSH vào VPS

### Từ Windows PowerShell:
```bash
ssh root@YOUR_VPS_IP
# Nhập password khi được hỏi
```

### Hoặc dùng PuTTY nếu thích giao diện

---

## 📦 BƯỚC 2: Cài Đặt Môi Trường Trên VPS

### 2.1. Update hệ thống
```bash
apt update && apt upgrade -y
```

### 2.2. Cài Node.js (v18 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
node -v  # Kiểm tra version
npm -v
```

### 2.3. Cài PM2 (Process Manager)
```bash
npm install -g pm2
```

### 2.4. Cài Nginx (Web Server)
```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 2.5. Cài Git
```bash
apt install -y git
```

---

## 📤 BƯỚC 3: Upload Code Lên VPS

### Phương án 1: Dùng Git (Khuyên dùng)
```bash
# Trên VPS
cd /var/www
git clone YOUR_GITHUB_REPO_URL floral-shop
cd floral-shop
npm install
```

### Phương án 2: Upload thủ công bằng FileZilla/WinSCP
- Host: YOUR_VPS_IP
- Port: 22
- Username: root
- Password: YOUR_PASSWORD
- Upload toàn bộ folder vào `/var/www/floral-shop`

### Phương án 3: Dùng SCP từ máy local
```bash
# Từ máy Windows (PowerShell)
scp -r e:\TIENTIÈNOLORITS root@YOUR_VPS_IP:/var/www/floral-shop
```

---

## 🏗️ BƯỚC 4: Build Production Trên VPS

```bash
cd /var/www/floral-shop

# Cài dependencies
npm install

# Build frontend
npm run build

# Kiểm tra folder dist đã tạo chưa
ls -la dist/
```

---

## ⚙️ BƯỚC 5: Cấu Hình Backend

### 5.1. Tạo file .env (nếu cần)
```bash
nano .env
```

Nội dung:
```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
```

### 5.2. Tạo folder uploads và database
```bash
mkdir -p uploads
touch database.json
```

### 5.3. Chạy backend với PM2
```bash
pm2 start server.js --name floral-backend
pm2 save
pm2 startup
```

Kiểm tra:
```bash
pm2 status
pm2 logs floral-backend
```

---

## 🌐 BƯỚC 6: Cấu Hình Nginx

### 6.1. Tạo config file
```bash
nano /etc/nginx/sites-available/floral-shop
```

### 6.2. Nội dung config (KHÔNG có domain):
```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;

    # Frontend (Static files từ dist)
    location / {
        root /var/www/floral-shop/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static files
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploads folder
    location /uploads {
        alias /var/www/floral-shop/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.3. Nội dung config (CÓ domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Giống như trên
    location / {
        root /var/www/floral-shop/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /var/www/floral-shop/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6.4. Enable site và restart Nginx
```bash
# Enable site
ln -s /etc/nginx/sites-available/floral-shop /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## 🔒 BƯỚC 7: Cài SSL (HTTPS) - Chỉ khi có Domain

### 7.1. Cài Certbot
```bash
apt install -y certbot python3-certbot-nginx
```

### 7.2. Lấy SSL certificate
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Nhập email và đồng ý terms.

### 7.3. Auto-renew
```bash
certbot renew --dry-run
```

---

## 🔥 BƯỚC 8: Cấu Hình Tường Lửa

```bash
# Allow HTTP
ufw allow 80/tcp

# Allow HTTPS
ufw allow 443/tcp

# Allow SSH
ufw allow 22/tcp

# Enable firewall
ufw enable
ufw status
```

---

## ✅ BƯỚC 9: Kiểm Tra & Test

### 9.1. Kiểm tra backend
```bash
curl http://localhost:3001/api/database
```

### 9.2. Kiểm tra từ browser
Truy cập:
- `http://YOUR_VPS_IP` (hoặc domain)
- Kiểm tra admin panel
- Upload ảnh test
- Tạo sản phẩm test

### 9.3. Kiểm tra PM2
```bash
pm2 status
pm2 logs floral-backend --lines 50
```

### 9.4. Kiểm tra Nginx
```bash
systemctl status nginx
tail -f /var/log/nginx/error.log
```

---

## 🔄 Update Code Sau Này

### Cách 1: Git Pull
```bash
cd /var/www/floral-shop
git pull
npm install
npm run build
pm2 restart floral-backend
```

### Cách 2: Upload lại file
- Upload file mới
- Chạy `npm run build`
- Restart PM2: `pm2 restart floral-backend`

---

## 🆘 Troubleshooting

### Lỗi: Port 3001 đã được dùng
```bash
lsof -i :3001
kill -9 PID_NUMBER
pm2 restart floral-backend
```

### Lỗi: Nginx 502 Bad Gateway
```bash
# Kiểm tra backend có chạy không
pm2 status
pm2 logs floral-backend

# Restart backend
pm2 restart floral-backend
```

### Lỗi: Permission denied khi upload ảnh
```bash
chmod -R 755 /var/www/floral-shop/uploads
chown -R www-data:www-data /var/www/floral-shop/uploads
```

### Lỗi: Database bị lỗi
```bash
# Backup database
cp database.json database.backup.json

# Reset database
echo '{"products":[],"categories":[],"settings":{},"categorySettings":{},"media":{}}' > database.json
```

---

## 📊 Monitoring

### Xem logs
```bash
# PM2 logs
pm2 logs floral-backend

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Performance
```bash
# CPU & RAM usage
htop

# PM2 monitoring
pm2 monit
```

---

## 🎯 Checklist Deploy Thành Công

- [ ] VPS đã cài đủ môi trường (Node.js, Nginx, PM2)
- [ ] Code đã upload lên `/var/www/floral-shop`
- [ ] `npm install` và `npm run build` thành công
- [ ] Backend chạy với PM2 (`pm2 status` show online)
- [ ] Nginx config đúng và restart thành công
- [ ] Truy cập `http://YOUR_IP` thấy website
- [ ] Admin panel hoạt động (`http://YOUR_IP/#admin`)
- [ ] Upload ảnh thành công
- [ ] Tạo sản phẩm hiển thị đúng
- [ ] (Nếu có domain) SSL đã cài và HTTPS hoạt động

---

## 💡 Tips

1. **Backup thường xuyên**:
   ```bash
   tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/floral-shop
   ```

2. **Tự động backup database**:
   ```bash
   crontab -e
   # Thêm dòng: 0 2 * * * cp /var/www/floral-shop/database.json /var/www/floral-shop/backup-$(date +\%Y\%m\%d).json
   ```

3. **Monitor disk space**:
   ```bash
   df -h
   ```

4. **Clean old uploads nếu cần**:
   ```bash
   find /var/www/floral-shop/uploads -mtime +90 -delete
   ```

---

🎉 **Chúc mừng! Website đã live trên VPS!**
