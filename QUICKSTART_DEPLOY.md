# ⚡ Quick Start - Deploy to VPS (Node.js 22 LTS - Mới Nhất)

## 🎯 TÓM TẮT NHANH - TRIỂN KHAI 5 PHÚT

### Bước 1: Cài Môi Trường Trên VPS (1 lần duy nhất)
```bash
# SSH vào VPS
ssh root@YOUR_VPS_IP

# 🚀 Script cài tất cả một lượt (Node.js 22 LTS - Mới nhất)
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
apt update && apt install -y nodejs nginx git && \
npm install -g pm2@latest && \
node -v && npm -v
```

**✅ Hoàn thành!** Bước này chỉ làm 1 lần duy nhất.

**Kỳ vọng output:**
```
v22.x.x   (Node.js version)
10.x.x    (NPM version)
```

---

### Bước 2: Upload Code (Chọn 1 Cách Nhanh Nhất)

#### ⚡ CÁCH 1: Git Clone (NHANH NHẤT - Khuyên dùng)
```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git floral-shop
cd floral-shop
```

#### 💻 CÁCH 2: SCP từ Windows (Nhanh)
```powershell
# Trên máy Windows (PowerShell)
scp -r e:\TIENTIÈNOLORITS\* root@YOUR_VPS_IP:/var/www/floral-shop/

# Sau đó SSH vào VPS
ssh root@YOUR_VPS_IP
cd /var/www/floral-shop
```

#### 📂 CÁCH 3: FileZilla/WinSCP (Giao diện đồ họa)
- **Host:** `YOUR_VPS_IP`
- **Port:** `22`
- **Username:** `root`
- **Password:** `YOUR_PASSWORD`
- **Đường dẫn VPS:** `/var/www/floral-shop`
- Drag & drop toàn bộ folder vào

---

### Bước 3: Chạy Script Tự Động Deploy
```bash
cd /var/www/floral-shop
chmod +x deploy.sh
bash deploy.sh
```

**Script sẽ tự động:**
- ✅ Cài dependencies (npm install)
- ✅ Build production (npm run build)
- ✅ Tạo database.json và folders
- ✅ Cấu hình PM2 (backend)
- ✅ Cấu hình Nginx (reverse proxy)
- ✅ Cấu hình firewall (ports 80, 443, 22)

⏱️ **Thời gian:** ~2-3 phút

---

### Bước 4: Truy Cập Website
```
http://YOUR_VPS_IP
```

**🎉 Xong! Website đã live!**

- **Frontend:** `http://YOUR_VPS_IP`
- **Admin Panel:** `http://YOUR_VPS_IP/#admin`
- **API:** `http://YOUR_VPS_IP/api/database`

---

## 📝 HƯỚNG DẪN CHI TIẾT

Xem file [`DEPLOY_VPS_GUIDE.md`](./DEPLOY_VPS_GUIDE.md) để có hướng dẫn đầy đủ!

---

## 🔄 Update Code Sau Này

```bash
cd /var/www/floral-shop
bash update.sh
```

Hoặc thủ công:
```bash
cd /var/www/floral-shop
git pull              # Nếu dùng git
npm install           # Cài dependencies mới
npm run build         # Build lại
pm2 restart floral-backend  # Restart backend
```

---

## 🆘 Troubleshooting Nhanh

### ❌ Website không truy cập được?
```bash
# Kiểm tra backend
pm2 status
pm2 logs floral-backend --lines 50

# Kiểm tra Nginx
systemctl status nginx
nginx -t

# Restart tất cả
pm2 restart floral-backend
systemctl restart nginx
```

### ❌ Port 3001 bị chiếm?
```bash
# Xem process nào đang dùng port
lsof -i :3001

# Kill process
kill -9 PID_NUMBER

# Hoặc đổi port trong server.js
```

### ❌ Lỗi upload ảnh (Permission denied)?
```bash
chmod -R 755 /var/www/floral-shop/uploads
chown -R www-data:www-data /var/www/floral-shop/uploads
```

### ❌ Nginx 502 Bad Gateway?
```bash
# Backend chưa chạy hoặc đã crash
pm2 status
pm2 restart floral-backend

# Kiểm tra logs
pm2 logs floral-backend
```

### ❌ Build failed?
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📊 Thông Tin VPS Khuyên Dùng

### Cấu hình tối thiểu:
- **OS**: Ubuntu 22.04 LTS (hoặc 24.04 LTS)
- **RAM**: 1GB (khuyên dùng 2GB)
- **CPU**: 1 vCPU
- **Storage**: 25GB SSD
- **Bandwidth**: 1TB/tháng

### VPS providers tốt:
- **Vultr** (khuyên dùng) - $5-6/tháng
- **DigitalOcean** - $6/tháng
- **Linode/Akamai** - $5/tháng
- **Hetzner** - €4/tháng (rẻ nhất)

### Ports cần mở:
- **22** - SSH
- **80** - HTTP
- **443** - HTTPS (nếu có SSL)

---

## 🎯 Checklist Deploy Thành Công

- [ ] SSH vào VPS thành công
- [ ] Node.js 22+ đã cài (chạy `node -v`)
- [ ] Nginx, PM2, Git đã cài
- [ ] Code đã upload vào `/var/www/floral-shop`
- [ ] `bash deploy.sh` chạy không lỗi
- [ ] `pm2 status` hiển thị `floral-backend` đang online
- [ ] Truy cập `http://YOUR_IP` thấy website
- [ ] Admin panel hoạt động (`http://YOUR_IP/#admin`)
- [ ] Upload ảnh thành công
- [ ] Tạo sản phẩm hiển thị đúng

---

## 💡 Tips Pro

### 1. Tự động backup database hàng ngày
```bash
crontab -e
# Thêm dòng này:
0 2 * * * cp /var/www/floral-shop/database.json /var/www/floral-shop/backup-$(date +\%Y\%m\%d).json
```

### 2. Monitor logs realtime
```bash
# PM2 logs
pm2 logs floral-backend --lines 100

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### 3. Xem resource usage
```bash
# CPU & RAM
htop

# PM2 monitor
pm2 monit

# Disk space
df -h
```

### 4. Cài SSL miễn phí (nếu có domain)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. Tối ưu Nginx (thêm vào config)
```nginx
# Gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;

# Client body size (cho upload ảnh lớn)
client_max_body_size 50M;
```

---

## 🚀 Nâng Cao (Tùy chọn)

### Setup CDN với Cloudflare (Miễn phí)
1. Đăng ký Cloudflare
2. Add domain của bạn
3. Đổi nameservers theo hướng dẫn
4. Enable "Auto Minify" và "Brotli"
5. Tốc độ tăng 50-70%!

### PM2 Startup (Auto restart khi reboot VPS)
```bash
pm2 startup
pm2 save
```

### Hạn chế SSH brute-force
```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

**Good luck! 🚀**

**Có vấn đề gì ping mình nhé!** ❤️
