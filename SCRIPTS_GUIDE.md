# 🛠️ Scripts Hướng Dẫn

Tổng hợp các scripts tự động để deploy và troubleshoot ứng dụng.

---

## 📜 Danh Sách Scripts

| Script | Mục Đích | Khi Nào Dùng |
|--------|----------|--------------|
| `setup-vps.sh` | Setup môi trường VPS | Lần đầu setup VPS mới |
| `deploy.sh` | Deploy ứng dụng | Lần đầu deploy hoặc deploy lại |
| `update.sh` | Update code | Khi có code mới |
| `fix-all.sh` | Fix tất cả lỗi | Khi website không hoạt động |
| `debug.sh` | Kiểm tra hệ thống | Để debug và tìm lỗi |

---

## 🚀 Quy Trình Deploy Lần Đầu

### Bước 1: Setup VPS (1 lần duy nhất)

```bash
ssh root@YOUR_VPS_IP
bash setup-vps.sh
```

### Bước 2: Upload Code

```bash
cd /var/www
git clone YOUR_REPO_URL floral-shop
cd floral-shop
```

### Bước 3: Deploy

```bash
chmod +x deploy.sh
bash deploy.sh
```

✅ **Xong!** Truy cập: `http://YOUR_VPS_IP`

---

## 🔄 Update Code Sau Này

```bash
cd /var/www/floral-shop
bash update.sh
```

Script sẽ tự động:
- 💾 Backup database & uploads
- 📥 Pull code mới
- 📦 Install dependencies
- 🔨 Build frontend
- 🔄 Restart backend

---

## 🔧 Khi Website Không Hoạt động

### Cách 1: Fix Tự Động (Khuyên Dùng)

```bash
cd /var/www/floral-shop
chmod +x fix-all.sh
bash fix-all.sh
```

Script sẽ tự động:
- ✅ Build lại frontend
- ✅ Restart backend (PM2)
- ✅ Tạo lại Nginx config
- ✅ Reload Nginx
- ✅ Mở firewall
- ✅ Kiểm tra hệ thống

### Cách 2: Debug Thủ Công

```bash
cd /var/www/floral-shop
chmod +x debug.sh
bash debug.sh
```

Script sẽ kiểm tra:
- PM2 status & logs
- Nginx status & config
- Ports (80, 3001)
- Firewall
- Folder `dist/`
- Và đưa ra gợi ý fix

---

## 📋 Chi Tiết Từng Script

### 1. `setup-vps.sh` - Setup VPS

**Chức năng:**
- Cài Node.js 22 LTS
- Cài Nginx, Git, PM2
- Cấu hình firewall cơ bản
- Tạo folder project

**Sử dụng:**
```bash
chmod +x setup-vps.sh
bash setup-vps.sh
```

**Lưu ý:** Chỉ chạy 1 lần khi setup VPS mới

---

### 2. `deploy.sh` - Deploy Ứng Dụng

**Chức năng:**
- Install dependencies
- Build frontend
- Setup PM2 cho backend
- Cấu hình Nginx
- Mở firewall

**Sử dụng:**
```bash
chmod +x deploy.sh
bash deploy.sh
```

**Lưu ý:** Chạy trong folder `/var/www/floral-shop`

---

### 3. `update.sh` - Update Code

**Chức năng:**
- Backup database & uploads (giữ 5 bản gần nhất)
- Pull code mới từ Git
- Install dependencies mới
- Build lại frontend
- Restart backend

**Sử dụng:**
```bash
bash update.sh
```

**Lưu ý:** Backup được lưu trong folder `backups/`

---

### 4. `fix-all.sh` - Fix Tất Cả Lỗi

**Chức năng:**
- Build lại frontend
- Tạo lại PM2 config
- Restart backend
- Tạo lại Nginx config
- Reload Nginx
- Mở firewall
- Kiểm tra hệ thống

**Sử dụng:**
```bash
chmod +x fix-all.sh
bash fix-all.sh
```

**Khi nào dùng:**
- Website không hiển thị
- Nginx 502/503 error
- Backend không chạy
- Sau khi sửa config

---

### 5. `debug.sh` - Debug Hệ Thống

**Chức năng:**
- Kiểm tra PM2 status & logs
- Kiểm tra Nginx status & config
- Kiểm tra ports
- Kiểm tra firewall
- Kiểm tra folder `dist/`
- Kiểm tra quyền files
- Đưa ra gợi ý fix

**Sử dụng:**
```bash
chmod +x debug.sh
bash debug.sh
```

**Lưu output:**
```bash
bash debug.sh > debug-output.txt 2>&1
cat debug-output.txt
```

---

## 🧪 Test Sau Khi Deploy

```bash
# Test 1: PM2
pm2 status
# → Phải thấy "floral-backend" status: online

# Test 2: Nginx
sudo systemctl status nginx
# → Phải thấy "active (running)"

# Test 3: Localhost
curl http://localhost
# → Phải thấy HTML code

# Test 4: Backend API
curl http://localhost:3001/api/ping
# → Phải thấy {"success":true}

# Test 5: Public IP
curl http://YOUR_VPS_IP
# → Phải thấy HTML code
```

---

## 📝 Các Lệnh Hữu Ích

### PM2 Commands
```bash
pm2 status                    # Xem status
pm2 logs floral-backend       # Xem logs
pm2 restart floral-backend    # Restart
pm2 stop floral-backend       # Stop
pm2 delete floral-backend     # Delete
```

### Nginx Commands
```bash
sudo systemctl status nginx   # Xem status
sudo nginx -t                 # Test config
sudo systemctl reload nginx   # Reload
sudo systemctl restart nginx  # Restart
sudo tail -f /var/log/nginx/error.log  # Xem logs
```

### Build Commands
```bash
npm run build                 # Build frontend
npm run dev                   # Dev mode (local)
npm run server                # Run backend (local)
```

---

## 🐛 Troubleshooting

### Website không hiển thị
```bash
bash fix-all.sh
```

### Muốn debug chi tiết
```bash
bash debug.sh
```

### Backend không chạy
```bash
pm2 restart floral-backend
pm2 logs floral-backend
```

### Nginx error
```bash
sudo nginx -t
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

### Build failed
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Tài Liệu Tham Khảo

- **Quick Start:** `QUICKSTART_DEPLOY.md`
- **Full Guide:** `DEPLOY_VPS_GUIDE.md`
- **Troubleshooting:** `TROUBLESHOOTING.md`
- **Architecture:** `ARCHITECTURE.md`
- **Fix PM2 Error:** `FIX_PM2_ERROR.md`

---

## ✅ Checklist Deploy

- [ ] VPS đã setup (Node.js 22, Nginx, PM2)
- [ ] Code đã upload vào `/var/www/floral-shop`
- [ ] Đã chạy `bash deploy.sh`
- [ ] PM2 status: `online`
- [ ] Nginx status: `active`
- [ ] Firewall port 80: `ALLOW`
- [ ] Test `curl http://localhost`: OK
- [ ] Test `curl http://YOUR_VPS_IP`: OK

---

## 🆘 Hỗ Trợ

Nếu gặp vấn đề:

1. Chạy `bash debug.sh` để kiểm tra
2. Chạy `bash fix-all.sh` để tự động fix
3. Xem logs: `pm2 logs` và `sudo tail -f /var/log/nginx/error.log`
4. Đọc `TROUBLESHOOTING.md` để biết thêm chi tiết

---

**Last Updated:** 2026-01-03
