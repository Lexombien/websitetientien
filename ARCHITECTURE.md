# 🏗️ Kiến Trúc Ứng Dụng

## 📊 Tổng Quan

Ứng dụng **Floral Shop** là một **Full-Stack Web Application** với kiến trúc:

```
┌─────────────────────────────────────────────────┐
│                   CLIENT                        │
│  React 19 + Vite (Frontend - Port 5173)        │
│  - Admin Panel                                  │
│  - Product Management                           │
│  - Media Library                                │
└─────────────────┬───────────────────────────────┘
                  │ HTTP/API Calls
                  ▼
┌─────────────────────────────────────────────────┐
│                   SERVER                        │
│  Express.js (Backend - Port 3001)              │
│  - REST API                                     │
│  - File Upload (Multer)                         │
│  - Database (JSON)                              │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│                  STORAGE                        │
│  - database.json (Products, Categories, etc)   │
│  - uploads/ (Images)                            │
└─────────────────────────────────────────────────┘
```

---

## 🎨 Frontend (React + Vite)

### Tech Stack
- **React 19** - UI Library
- **Vite** - Build Tool & Dev Server
- **TypeScript** - Type Safety
- **CSS Modules** - Styling

### Cấu Trúc Thư Mục
```
├── App.tsx                 # Main App Component
├── components/             # React Components
│   ├── AdminPanel.tsx
│   ├── ProductCard.tsx
│   ├── MediaLibrary.tsx
│   └── ...
├── hooks/                  # Custom Hooks
├── utils/                  # Utility Functions
├── types.ts                # TypeScript Types
├── constants.ts            # Constants
└── index.css              # Global Styles
```

### Features
- ✅ Product Management (CRUD)
- ✅ Category Management
- ✅ Media Library với SEO (Alt, Title, Description)
- ✅ Image Upload & Delete
- ✅ Admin Panel
- ✅ Responsive Design
- ✅ AI Integration (Gemini)

---

## ⚙️ Backend (Express.js)

### Tech Stack
- **Express 5** - Web Framework
- **Multer** - File Upload
- **CORS** - Cross-Origin Resource Sharing
- **Node.js 22 LTS** - Runtime

### API Endpoints

#### Database API
```
GET  /api/database          # Lấy toàn bộ database
POST /api/database          # Lưu database
GET  /api/ping              # Health check
```

#### Upload API
```
POST   /api/upload          # Upload single image
POST   /api/upload-multiple # Upload multiple images (max 5)
DELETE /api/upload/:filename # Delete image
GET    /api/uploads         # List all images
```

#### Static Files
```
GET /uploads/:filename      # Serve uploaded images
```

### Database Schema (JSON)

```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "price": "number",
      "description": "string",
      "category": "string",
      "images": ["url1", "url2"],
      "featured": "boolean"
    }
  ],
  "categories": [
    {
      "id": "string",
      "name": "string",
      "description": "string"
    }
  ],
  "settings": {
    "siteName": "string",
    "logo": "string",
    "customCSS": "string"
  },
  "categorySettings": {},
  "media": {
    "filename": {
      "alt": "string",
      "title": "string",
      "description": "string"
    }
  },
  "zaloNumber": "string"
}
```

---

## 🚀 Development Workflow

### Local Development

1. **Start Backend:**
   ```bash
   npm run server
   # Backend chạy trên http://localhost:3001
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   # Frontend chạy trên http://localhost:5173
   ```

3. **Hoặc chạy cùng lúc:**
   ```bash
   npm run dev:all
   # Chạy cả backend và frontend
   ```

### Production Build

```bash
npm run build
# Output: dist/ folder
```

---

## 🌐 Production Deployment (VPS)

### Kiến Trúc Production

```
┌─────────────────────────────────────────────────┐
│                   NGINX                         │
│  Reverse Proxy (Port 80)                       │
│  - Serve static files (dist/)                  │
│  - Proxy /api/* to backend                     │
│  - Serve /uploads/*                            │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│                    PM2                          │
│  Process Manager                                │
│  - Auto restart on crash                       │
│  - Log management                              │
│  - Cluster mode support                        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│              Express Backend                    │
│  Running on localhost:3001                     │
└─────────────────────────────────────────────────┘
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name _;

    # Frontend (static files)
    location / {
        root /var/www/floral-shop/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Uploads
    location /uploads/ {
        alias /var/www/floral-shop/uploads/;
    }
}
```

### PM2 Configuration

```javascript
// ecosystem.config.cjs (CommonJS vì package.json dùng "type": "module")
module.exports = {
  apps: [{
    name: 'floral-backend',
    script: './server.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

**Note:** File phải là `.cjs` (CommonJS) vì `package.json` có `"type": "module"`.

---

## 📁 File Structure

```
floral-shop/
├── 📄 Frontend Files
│   ├── App.tsx
│   ├── index.tsx
│   ├── index.html
│   ├── components/
│   ├── hooks/
│   └── utils/
│
├── ⚙️ Backend Files
│   ├── server.js
│   └── ecosystem.config.cjs (generated)
│
├── 💾 Data & Storage
│   ├── database.json
│   ├── uploads/
│   └── backups/
│
├── 🛠️ Config Files
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.local
│   └── .env.example
│
├── 🚀 Deploy Scripts
│   ├── setup-vps.sh
│   ├── deploy.sh
│   └── update.sh
│
└── 📖 Documentation
    ├── README.md
    ├── QUICKSTART_DEPLOY.md
    ├── DEPLOY_VPS_GUIDE.md
    └── ARCHITECTURE.md (this file)
```

---

## 🔒 Security

### Backend Security
- ✅ CORS enabled
- ✅ File type validation (images only)
- ✅ File size limit (5MB)
- ✅ Path traversal protection
- ✅ Sanitized filenames

### Frontend Security
- ✅ XSS protection
- ✅ CSRF protection (via SameSite cookies)
- ✅ Input validation
- ✅ Secure headers (via Nginx)

---

## 📊 Performance

### Frontend Optimization
- ✅ Code splitting (Vite)
- ✅ Lazy loading
- ✅ Image optimization
- ✅ CSS minification
- ✅ Tree shaking

### Backend Optimization
- ✅ Static file caching (1 year)
- ✅ Gzip compression (Nginx)
- ✅ ETags for cache validation
- ✅ PM2 cluster mode support

---

## 🔄 Data Flow

### Upload Image Flow

```
1. User selects image in Admin Panel
   ↓
2. Frontend sends POST to /api/upload
   ↓
3. Multer processes file
   ↓
4. File saved to uploads/
   ↓
5. Backend returns image URL
   ↓
6. Frontend updates UI with new image
```

### Save Product Flow

```
1. User fills product form
   ↓
2. Frontend validates data
   ↓
3. Frontend sends POST to /api/database
   ↓
4. Backend saves to database.json
   ↓
5. Backend returns success
   ↓
6. Frontend updates product list
```

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Upload image
- [ ] Delete image
- [ ] Create product
- [ ] Edit product
- [ ] Delete product
- [ ] Create category
- [ ] Edit category
- [ ] Delete category
- [ ] Update settings
- [ ] Custom CSS works

---

## 📈 Scalability

### Current Limitations
- JSON database (not suitable for >1000 products)
- Single server (no load balancing)
- File storage on server (no CDN)

### Future Improvements
- Migrate to PostgreSQL/MongoDB
- Add Redis for caching
- Use S3/CloudFlare for image storage
- Implement load balancing
- Add search functionality (Elasticsearch)

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, TypeScript |
| **Backend** | Express 5, Node.js 22 |
| **Database** | JSON (file-based) |
| **File Upload** | Multer |
| **Process Manager** | PM2 |
| **Web Server** | Nginx |
| **AI** | Google Gemini API |

---

## 📞 Support

Nếu cần hỗ trợ, kiểm tra:
- Logs backend: `pm2 logs floral-backend`
- Logs Nginx: `sudo tail -f /var/log/nginx/error.log`
- Database: `cat database.json | jq`

---

**Last Updated:** 2026-01-03
