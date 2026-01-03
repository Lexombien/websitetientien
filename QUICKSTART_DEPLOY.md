# ⚡ Quick Deploy Guide - VPS (No Domain)

Hướng dẫn deploy nhanh nhất lên VPS chưa có domain.

---

## 🚀 3 Bước Deploy

### **1️⃣ Setup VPS** (1 lần duy nhất)

SSH vào VPS và chạy:

```bash
# Cài Node.js 22 + Nginx + PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt update && apt install -y nodejs nginx git ufw
npm install -g pm2@latest

# Tạo folder
mkdir -p /var/www/floral-shop
```

---

### **2️⃣ Upload Code**

**Cách 1: Git** (Nhanh nhất)
```bash
cd /var/www
git clone YOUR_REPO_URL floral-shop
cd floral-shop
```

**Cách 2: SCP từ Windows**
```powershell
scp -r e:\TIENTIÈNOLORITS\* root@YOUR_VPS_IP:/var/www/floral-shop/
```

---

### **3️⃣ Deploy**

```bash
cd /var/www/floral-shop
chmod +x deploy.sh
bash deploy.sh
```

✅ **Done!** Truy cập: `http://YOUR_VPS_IP`

---

## 🔄 Update Sau Này

```bash
cd /var/www/floral-shop
bash update.sh
```

---

## 📝 Các Lệnh Hữu Ích

```bash
pm2 status                    # Xem status backend
pm2 logs floral-backend       # Xem logs
pm2 restart floral-backend    # Restart backend
systemctl status nginx        # Xem status Nginx
```

---

## 🐛 Lỗi Thường Gặp

**Website không truy cập được:**
```bash
pm2 status
pm2 logs floral-backend --lines 50
sudo systemctl status nginx
```

**Port bị chiếm:**
```bash
lsof -i :3001
kill -9 PID
pm2 restart floral-backend
```

---

📖 **Chi tiết:** Xem [DEPLOY_VPS_GUIDE.md](./DEPLOY_VPS_GUIDE.md)
