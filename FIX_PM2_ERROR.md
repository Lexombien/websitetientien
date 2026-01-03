# 🔧 Fix: PM2 ES Module Error

## Lỗi

```
[PM2][ERROR] File ecosystem.config.js malformated
ReferenceError: module is not defined in ES module scope
```

## Nguyên Nhân

File `package.json` có `"type": "module"` (ES modules), nhưng PM2 cần file config là **CommonJS**.

## Giải Pháp

### Cách 1: Sửa Thủ Công (Nhanh)

Nếu bạn đang gặp lỗi này trên VPS:

```bash
cd /var/www/floral-shop

# Xóa file .js cũ (nếu có)
rm -f ecosystem.config.js

# Tạo file .cjs mới
cat > ecosystem.config.cjs << 'EOF'
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

# Start PM2 với file .cjs
pm2 delete floral-backend 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
```

### Cách 2: Pull Code Mới & Deploy Lại

```bash
cd /var/www/floral-shop

# Pull code mới (đã fix)
git pull

# Deploy lại
bash deploy.sh
```

## Kiểm Tra

```bash
# Kiểm tra PM2 đang chạy
pm2 status

# Xem logs
pm2 logs floral-backend
```

Nếu thấy `floral-backend` status là `online` → ✅ Đã fix thành công!

## Giải Thích

- **`.js`** với `"type": "module"` → ES modules (dùng `import/export`)
- **`.cjs`** → CommonJS (dùng `require/module.exports`)
- PM2 cần CommonJS format cho file config

## Tài Liệu Tham Khảo

- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [PM2 Ecosystem File](https://pm2.keymetrics.io/docs/usage/application-declaration/)
