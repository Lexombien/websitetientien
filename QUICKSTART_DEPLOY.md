# ⚡ Quick Start - Deploy to Vultr VPS

## 🎯 TÓM TẮT NHANH

### Bước 1: Trên VPS
```bash
# SSH vào VPS
ssh root@YOUR_VPS_IP

# Cài môi trường một lần
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt update && apt install -y nodejs nginx git
npm install -g pm2
```

### Bước 2: Upload Code
```bash
# Tạo folder
mkdir -p /var/www/floral-shop

# Upload code (chọn 1 trong 3 cách)
# Cách 1: Git (nếu có repo)
git clone YOUR_REPO_URL /var/www/floral-shop

# Cách 2: SCP từ máy local
scp -r e:\TIENTIÈNOLORITS root@YOUR_VPS_IP:/var/www/floral-shop

# Cách 3: FileZilla/WinSCP (giao diện đồ họa)
```

### Bước 3: Chạy Script Tự Động
```bash
cd /var/www/floral-shop
chmod +x deploy.sh
bash deploy.sh
```

### Bước 4: Truy Cập Website
```
http://YOUR_VPS_IP
```

---

## 📝 CHI TIẾT

Xem file [`DEPLOY_VPS_GUIDE.md`](./DEPLOY_VPS_GUIDE.md) để có hướng dẫn đầy đủ!

---

## 🔄 Update Sau Này

```bash
cd /var/www/floral-shop
bash update.sh
```

---

## 🆘 Troubleshooting Nhanh

### Website không truy cập được?
```bash
# Kiểm tra backend
pm2 status
pm2 logs floral-backend

# Kiểm tra Nginx
systemctl status nginx

# Restart tất cả
pm2 restart floral-backend
systemctl restart nginx
```

### Port 3001 bị chiếm?
```bash
lsof -i :3001
# Hoặc đổi port trong server.js
```

---

## 📊 Thông Tin VPS

- **OS**: Ubuntu 22.04 LTS (khuyên dùng)
- **RAM**: Tối thiểu 1GB
- **Storage**: Tối thiểu 25GB
- **Port cần mở**: 80, 443, 22

---

## 🎯 Mục Tiêu

✅ Website chạy tại `http://YOUR_IP`  
✅ Admin tại `http://YOUR_IP/#admin`  
✅ Upload ảnh hoạt động  
✅ Database lưu được  
✅ Tốc độ nhanh với cache  

**Good luck! 🚀**
