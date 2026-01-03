#!/bin/bash

# ===================================
# 🔍 DEBUG SCRIPT - Floral Shop
# ===================================
# Script kiểm tra tất cả các thành phần

echo "🔍 BẮT ĐẦU KIỂM TRA HỆ THỐNG..."
echo "================================"
echo ""

# 1. Kiểm tra PM2
echo "📊 1. KIỂM TRA PM2 (Backend)"
echo "----------------------------"
pm2 status
echo ""
echo "Logs backend (50 dòng cuối):"
pm2 logs floral-backend --lines 50 --nostream
echo ""

# 2. Kiểm tra Nginx
echo "🌐 2. KIỂM TRA NGINX"
echo "----------------------------"
sudo systemctl status nginx --no-pager
echo ""
echo "Test Nginx config:"
sudo nginx -t
echo ""

# 3. Kiểm tra port
echo "🔌 3. KIỂM TRA PORTS"
echo "----------------------------"
echo "Port 80 (Nginx):"
sudo lsof -i :80 || echo "❌ Port 80 không có process nào"
echo ""
echo "Port 3001 (Backend):"
sudo lsof -i :3001 || echo "❌ Port 3001 không có process nào"
echo ""

# 4. Kiểm tra firewall
echo "🔥 4. KIỂM TRA FIREWALL"
echo "----------------------------"
sudo ufw status
echo ""

# 5. Kiểm tra folder dist
echo "📁 5. KIỂM TRA FOLDER DIST"
echo "----------------------------"
if [ -d "dist" ]; then
    echo "✅ Folder dist tồn tại"
    echo "Số lượng files trong dist:"
    find dist -type f | wc -l
    echo ""
    echo "File index.html:"
    if [ -f "dist/index.html" ]; then
        echo "✅ dist/index.html tồn tại"
        ls -lh dist/index.html
    else
        echo "❌ dist/index.html KHÔNG TỒN TẠI!"
    fi
else
    echo "❌ FOLDER DIST KHÔNG TỒN TẠI!"
fi
echo ""

# 6. Kiểm tra Nginx config
echo "⚙️  6. KIỂM TRA NGINX CONFIG"
echo "----------------------------"
if [ -f "/etc/nginx/sites-available/floral-shop" ]; then
    echo "✅ Nginx config tồn tại"
    echo "Nội dung config:"
    cat /etc/nginx/sites-available/floral-shop
else
    echo "❌ NGINX CONFIG KHÔNG TỒN TẠI!"
fi
echo ""

# 7. Test localhost
echo "🧪 7. TEST LOCALHOST"
echo "----------------------------"
echo "Test Nginx (port 80):"
curl -I http://localhost 2>&1 | head -10
echo ""
echo "Test Backend (port 3001):"
curl -s http://localhost:3001/api/ping || echo "❌ Backend không phản hồi"
echo ""

# 8. Kiểm tra logs Nginx
echo "📝 8. NGINX ERROR LOGS (20 dòng cuối)"
echo "----------------------------"
sudo tail -20 /var/log/nginx/error.log
echo ""

# 9. Kiểm tra quyền folder
echo "🔐 9. KIỂM TRA QUYỀN FOLDER"
echo "----------------------------"
echo "Quyền folder hiện tại:"
ls -la | grep -E "dist|uploads|database.json"
echo ""

# 10. Tóm tắt
echo "================================"
echo "📋 TÓM TẮT"
echo "================================"
echo ""

# Check PM2
if pm2 list | grep -q "floral-backend.*online"; then
    echo "✅ PM2: Backend đang chạy"
else
    echo "❌ PM2: Backend KHÔNG chạy hoặc có lỗi"
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Đang chạy"
else
    echo "❌ Nginx: KHÔNG chạy"
fi

# Check dist
if [ -f "dist/index.html" ]; then
    echo "✅ Frontend: Đã build"
else
    echo "❌ Frontend: CHƯA build hoặc thiếu file"
fi

# Check firewall
if sudo ufw status | grep -q "80.*ALLOW"; then
    echo "✅ Firewall: Port 80 đã mở"
else
    echo "❌ Firewall: Port 80 CHƯA mở"
fi

echo ""
echo "================================"
echo "🔧 GỢI Ý SỬA LỖI"
echo "================================"
echo ""

# Suggestions
if ! pm2 list | grep -q "floral-backend.*online"; then
    echo "🔧 Backend không chạy → Chạy: pm2 start ecosystem.config.cjs"
fi

if ! [ -f "dist/index.html" ]; then
    echo "🔧 Frontend chưa build → Chạy: npm run build"
fi

if ! sudo systemctl is-active --quiet nginx; then
    echo "🔧 Nginx không chạy → Chạy: sudo systemctl start nginx"
fi

if ! sudo ufw status | grep -q "80.*ALLOW"; then
    echo "🔧 Firewall chặn port 80 → Chạy: sudo ufw allow 80/tcp"
fi

echo ""
echo "✅ Kiểm tra hoàn tất!"
echo ""
