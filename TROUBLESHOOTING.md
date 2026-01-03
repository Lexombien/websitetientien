# 🔧 Troubleshooting: Website Trống Trơn

## Vấn Đề

Truy cập `http://45.76.189.14` nhưng trang trống trơn hoặc không hiển thị gì.

---

## 🔍 Bước 1: Chạy Script Debug

SSH vào VPS và chạy:

```bash
cd /var/www/floral-shop
chmod +x debug.sh
bash debug.sh
```

Script sẽ kiểm tra:
- ✅ PM2 (Backend)
- ✅ Nginx
- ✅ Ports (80, 3001)
- ✅ Firewall
- ✅ Folder `dist/`
- ✅ Nginx config
- ✅ Logs

---

## 🐛 Các Nguyên Nhân Thường Gặp

### 1️⃣ **Frontend Chưa Build**

**Triệu chứng:** Folder `dist/` không tồn tại hoặc rỗng

**Kiểm tra:**
```bash
ls -la dist/
```

**Fix:**
```bash
npm run build
sudo systemctl reload nginx
```

---

### 2️⃣ **Nginx Chưa Chạy**

**Triệu chứng:** `systemctl status nginx` hiển thị `inactive`

**Fix:**
```bash
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

### 3️⃣ **Nginx Config Sai**

**Kiểm tra:**
```bash
sudo nginx -t
```

**Nếu có lỗi, fix:**
```bash
# Xem config hiện tại
cat /etc/nginx/sites-available/floral-shop

# Chạy lại deploy để tạo config mới
bash deploy.sh
```

---

### 4️⃣ **Firewall Chặn Port 80**

**Kiểm tra:**
```bash
sudo ufw status
```

**Fix:**
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

### 5️⃣ **Nginx Không Trỏ Đúng Folder**

**Kiểm tra:**
```bash
cat /etc/nginx/sites-available/floral-shop | grep "root"
```

Phải thấy:
```nginx
root /var/www/floral-shop/dist;
```

**Fix nếu sai:**
```bash
# Lấy đường dẫn hiện tại
pwd

# Sửa Nginx config
sudo nano /etc/nginx/sites-available/floral-shop

# Sửa dòng root thành:
root /var/www/floral-shop/dist;

# Test và reload
sudo nginx -t
sudo systemctl reload nginx
```

---

### 6️⃣ **Thiếu Symlink**

**Kiểm tra:**
```bash
ls -la /etc/nginx/sites-enabled/
```

Phải thấy `floral-shop` link đến `../sites-available/floral-shop`

**Fix:**
```bash
sudo ln -sf /etc/nginx/sites-available/floral-shop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl reload nginx
```

---

### 7️⃣ **Port 80 Bị Chiếm**

**Kiểm tra:**
```bash
sudo lsof -i :80
```

**Nếu có process khác (không phải nginx):**
```bash
# Kill process đó
sudo kill -9 PID

# Restart Nginx
sudo systemctl restart nginx
```

---

## 🚀 Fix Nhanh (All-in-One)

Nếu không muốn debug từng bước, chạy lệnh này:

```bash
cd /var/www/floral-shop

# Build lại frontend
npm run build

# Restart backend
pm2 restart floral-backend

# Tạo lại Nginx config
CURRENT_DIR=$(pwd)
sudo tee /etc/nginx/sites-available/floral-shop > /dev/null << EOF
server {
    listen 80;
    server_name _;

    location / {
        root $CURRENT_DIR/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /uploads/ {
        alias $CURRENT_DIR/uploads/;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/floral-shop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test và reload
sudo nginx -t
sudo systemctl reload nginx

# Mở firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Kiểm tra
echo ""
echo "🔍 Kiểm tra:"
echo "----------------------------"
pm2 status
sudo systemctl status nginx --no-pager
curl -I http://localhost
```

---

## 🧪 Test Từng Bước

### Test 1: Nginx có chạy không?
```bash
sudo systemctl status nginx
```
→ Phải thấy `active (running)`

### Test 2: Nginx có serve được file không?
```bash
curl -I http://localhost
```
→ Phải thấy `HTTP/1.1 200 OK` hoặc `304`

### Test 3: File index.html có tồn tại không?
```bash
cat dist/index.html | head -20
```
→ Phải thấy HTML code

### Test 4: Backend có chạy không?
```bash
curl http://localhost:3001/api/ping
```
→ Phải thấy `{"success":true,"message":"Server is running"}`

### Test 5: Firewall có mở port 80 không?
```bash
sudo ufw status | grep 80
```
→ Phải thấy `80/tcp ALLOW`

---

## 📝 Logs Để Debug

### Nginx Error Log
```bash
sudo tail -f /var/log/nginx/error.log
```

### Nginx Access Log
```bash
sudo tail -f /var/log/nginx/access.log
```

### Backend Log (PM2)
```bash
pm2 logs floral-backend
```

---

## ✅ Checklist

Chạy từng lệnh này và đánh dấu ✅:

- [ ] `npm run build` → Có folder `dist/` với file `index.html`
- [ ] `pm2 status` → Backend status: `online`
- [ ] `sudo systemctl status nginx` → Nginx: `active (running)`
- [ ] `sudo nginx -t` → Config: `syntax is ok`
- [ ] `ls -la /etc/nginx/sites-enabled/` → Có symlink `floral-shop`
- [ ] `sudo ufw status` → Port 80: `ALLOW`
- [ ] `curl http://localhost` → HTTP 200 OK
- [ ] `curl http://localhost:3001/api/ping` → `{"success":true}`

Nếu tất cả đều ✅ → Website phải hoạt động!

---

## 🆘 Vẫn Không Được?

Gửi kết quả của các lệnh sau:

```bash
cd /var/www/floral-shop
bash debug.sh > debug-output.txt 2>&1
cat debug-output.txt
```

Copy toàn bộ output để được hỗ trợ thêm.

---

## 💡 Lưu Ý

- Sau mỗi lần sửa Nginx config → Chạy `sudo nginx -t` rồi `sudo systemctl reload nginx`
- Sau mỗi lần sửa code → Chạy `npm run build` rồi `pm2 restart floral-backend`
- Kiểm tra logs nếu có lỗi: `pm2 logs` và `sudo tail -f /var/log/nginx/error.log`
