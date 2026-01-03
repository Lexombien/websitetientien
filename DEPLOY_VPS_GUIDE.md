# 🚀 Hướng Dẫn Deploy Lên VPS (Chưa Có Domain)

Hướng dẫn này sẽ giúp bạn deploy ứng dụng Floral Shop (React + Express) lên VPS và truy cập qua **IP address**.

---

## 📋 Yêu Cầu

- VPS Ubuntu 20.04/22.04 (hoặc Debian)
- RAM: Tối thiểu 1GB
- SSH access với quyền root
- IP address của VPS

---

## 🎯 Các Bước Deploy

### **Bước 1: Chuẩn Bị VPS** (Chỉ làm 1 lần)

SSH vào VPS của bạn:

```bash
ssh root@YOUR_VPS_IP
```

Thay `YOUR_VPS_IP` bằng IP thực của VPS (ví dụ: `123.45.67.89`)

---

### **Bước 2: Setup Môi Trường** (Chỉ làm 1 lần)

Chạy lệnh sau để cài **Node.js 22 LTS**, **Nginx**, **PM2**:

```bash
# Cài Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt update && apt install -y nodejs nginx git ufw

# Cài PM2 (Process Manager)
npm install -g pm2@latest

# Kiểm tra version
node -v    # Phải là v22.x.x
npm -v     # Phải là 10.x.x
```

**Hoặc dùng script tự động:**

```bash
# Upload file setup-vps.sh lên VPS, sau đó:
chmod +x setup-vps.sh
bash setup-vps.sh
```

---

### **Bước 3: Upload Code Lên VPS**

Có 3 cách, chọn 1 cách bạn thích:

#### **Cách 1: Dùng Git** (Khuyên dùng)

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git floral-shop
cd floral-shop
```

#### **Cách 2: Dùng SCP từ Windows**

Trên máy Windows, mở **PowerShell** và chạy:

```powershell
scp -r e:\TIENTIÈNOLORITS\* root@YOUR_VPS_IP:/var/www/floral-shop/
```

Sau đó SSH vào VPS:

```bash
ssh root@YOUR_VPS_IP
cd /var/www/floral-shop
```

#### **Cách 3: Dùng FileZilla/WinSCP**

- **Host:** `YOUR_VPS_IP`
- **Port:** `22`
- **Username:** `root`
- **Password:** Mật khẩu VPS của bạn
- Upload toàn bộ folder vào: `/var/www/floral-shop`

---

### **Bước 4: Deploy Tự Động** 🚀

Sau khi code đã có trên VPS, chạy script deploy:

```bash
cd /var/www/floral-shop

# Cho phép chạy script
chmod +x deploy.sh

# Chạy deploy
bash deploy.sh
```

Script sẽ tự động:
- ✅ Cài dependencies (`npm install`)
- ✅ Build frontend (`npm run build`)
- ✅ Cấu hình PM2 để chạy backend
- ✅ Cấu hình Nginx để serve frontend + proxy API
- ✅ Mở firewall cho port 80

**Quá trình này mất khoảng 2-5 phút.**

---

### **Bước 5: Kiểm Tra**

Sau khi deploy xong, kiểm tra:

```bash
# Kiểm tra PM2 (backend)
pm2 status

# Kiểm tra Nginx
systemctl status nginx

# Test website
curl http://localhost
```

Nếu tất cả đều OK, bạn sẽ thấy:
- PM2 hiển thị `floral-backend` đang chạy
- Nginx status: `active (running)`

---

### **Bước 6: Truy Cập Website** 🌐

Mở trình duyệt và truy cập:

- **Frontend:** `http://YOUR_VPS_IP`
- **Admin Panel:** `http://YOUR_VPS_IP/#admin`

Thay `YOUR_VPS_IP` bằng IP thực của VPS (ví dụ: `http://123.45.67.89`)

---

## 🔧 Các Lệnh Hữu Ích

### Xem Logs Backend

```bash
pm2 logs floral-backend
pm2 logs floral-backend --lines 100  # Xem 100 dòng gần nhất
```

### Restart Backend

```bash
pm2 restart floral-backend
```

### Xem Status

```bash
pm2 status
```

### Reload Nginx

```bash
sudo systemctl reload nginx
```

### Xem Logs Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🔄 Update Code Sau Này

Khi bạn có code mới, chỉ cần:

```bash
cd /var/www/floral-shop
bash update.sh
```

Script sẽ tự động:
- 💾 Backup database và uploads
- 📥 Pull code mới (nếu dùng Git)
- 📦 Cài dependencies mới
- 🔨 Build lại frontend
- 🔄 Restart backend

**Hoặc làm thủ công:**

```bash
cd /var/www/floral-shop
git pull                          # Pull code mới
npm install                       # Cài dependencies
npm run build                     # Build frontend
pm2 restart floral-backend        # Restart backend
```

---

## 🐛 Troubleshooting

### 1. Website không truy cập được

```bash
# Kiểm tra PM2
pm2 status
pm2 logs floral-backend --lines 50

# Kiểm tra Nginx
sudo systemctl status nginx
sudo nginx -t  # Test config

# Kiểm tra firewall
sudo ufw status
```

### 2. Port 3001 bị chiếm

```bash
# Tìm process đang dùng port 3001
lsof -i :3001

# Kill process
kill -9 PID

# Restart backend
pm2 restart floral-backend
```

### 3. Build Failed

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 4. Nginx 502 Bad Gateway

```bash
# Kiểm tra backend có chạy không
pm2 status

# Nếu không chạy, start lại
pm2 start ecosystem.config.js

# Kiểm tra logs
pm2 logs floral-backend
```

### 5. Database bị mất

```bash
# Restore từ backup
cd /var/www/floral-shop/backups
ls -lh  # Xem các file backup

# Copy backup mới nhất
cp database_YYYYMMDD_HHMMSS.json ../database.json

# Restart backend
pm2 restart floral-backend
```

---

## 🔒 Bảo Mật (Tùy Chọn)

### Tạo User Mới (Không Dùng Root)

```bash
# Tạo user mới
adduser deploy
usermod -aG sudo deploy

# Chuyển quyền sở hữu folder
chown -R deploy:deploy /var/www/floral-shop

# Đăng nhập bằng user mới
su - deploy
```

### Cấu Hình SSH Key

```bash
# Trên máy Windows, tạo SSH key
ssh-keygen -t ed25519

# Copy public key lên VPS
ssh-copy-id root@YOUR_VPS_IP
```

### Tắt Password Login (Chỉ dùng SSH Key)

```bash
sudo nano /etc/ssh/sshd_config

# Sửa dòng sau:
PasswordAuthentication no

# Restart SSH
sudo systemctl restart sshd
```

---

## 🌐 Thêm Domain Sau Này

Khi bạn có domain, chỉ cần:

1. **Point A Record** của domain về IP VPS
2. **Sửa Nginx config:**

```bash
sudo nano /etc/nginx/sites-available/floral-shop
```

Thay dòng:
```nginx
server_name _;
```

Thành:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

3. **Reload Nginx:**

```bash
sudo nginx -t
sudo systemctl reload nginx
```

4. **Cài SSL (Let's Encrypt):**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
- Logs backend: `pm2 logs floral-backend`
- Logs Nginx: `sudo tail -f /var/log/nginx/error.log`
- Status: `pm2 status` và `sudo systemctl status nginx`

---

## ✅ Checklist Deploy

- [ ] VPS đã cài Node.js 22, Nginx, PM2
- [ ] Code đã upload lên `/var/www/floral-shop`
- [ ] Đã chạy `bash deploy.sh`
- [ ] PM2 hiển thị backend đang chạy
- [ ] Nginx status: active
- [ ] Firewall đã mở port 80
- [ ] Truy cập `http://YOUR_VPS_IP` thành công

---

🎉 **Chúc mừng! Website của bạn đã live!**
