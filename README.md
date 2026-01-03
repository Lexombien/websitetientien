<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/189MhlFY1Aom4p-vRcpA3vd_Y_wP83IXk

## Run Locally

**Prerequisites:**  Node.js 18+

### Quick Start (Chạy cả Backend + Frontend)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   # Copy .env.example thành .env.local
   cp .env.example .env.local
   
   # Mở .env.local và điền GEMINI_API_KEY
   ```

3. **Run the app:**

   **Cách 1: Chạy 2 terminal riêng** (Khuyên dùng)
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run dev
   ```

   **Cách 2: Chạy cùng lúc** (Cần cài `concurrently`)
   ```bash
   npm install --save-dev concurrently
   npm run dev:all
   ```

4. **Truy cập:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001/api`
   - Admin Panel: `http://localhost:5173/#admin`

### Available Scripts

- `npm run dev` - Chạy frontend (Vite dev server)
- `npm run server` - Chạy backend (Express server)
- `npm run build` - Build production
- `npm run preview` - Preview production build

---

## 🚀 Deploy to VPS (No Domain Required)

Deploy ứng dụng lên VPS và truy cập qua IP address trong **3 bước đơn giản**:

### Quick Deploy

1. **Setup VPS** (1 lần duy nhất):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
   apt update && apt install -y nodejs nginx git ufw
   npm install -g pm2@latest
   ```

2. **Upload code** lên `/var/www/floral-shop`

3. **Deploy**:
   ```bash
   cd /var/www/floral-shop
   bash deploy.sh
   ```

✅ **Done!** Truy cập: `http://YOUR_VPS_IP`

### 📖 Hướng Dẫn Chi Tiết

- **⚡ Quick Start:** [QUICKSTART_DEPLOY.md](./QUICKSTART_DEPLOY.md) - Deploy trong 5 phút
- **📚 Full Guide:** [DEPLOY_VPS_GUIDE.md](./DEPLOY_VPS_GUIDE.md) - Hướng dẫn đầy đủ + troubleshooting

### 🛠️ Scripts Tự Động

- `setup-vps.sh` - Setup môi trường VPS (Node 22, Nginx, PM2)
- `deploy.sh` - Deploy tự động (Build + Run)
- `update.sh` - Update code (Backup DB + Rebuild)
