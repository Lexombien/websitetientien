# ===================================
# UPLOAD & DEPLOY SCRIPT (Windows)
# ===================================
# Script tự động upload code và deploy lên VPS

$VPS_IP = "45.76.189.14"
$VPS_USER = "root"
$VPS_PATH = "/var/www/floral-shop"
$LOCAL_PATH = "e:\TIENTIÈNOLORITS"

Write-Host "🚀 BẮT ĐẦU UPLOAD & DEPLOY..." -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# 1. Upload code
Write-Host "📤 1. UPLOAD CODE LÊN VPS..." -ForegroundColor Yellow
Write-Host "----------------------------"
scp -r "$LOCAL_PATH\*" "${VPS_USER}@${VPS_IP}:${VPS_PATH}/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Upload thành công!" -ForegroundColor Green
} else {
    Write-Host "❌ Upload thất bại!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 2. Build & Deploy trên VPS
Write-Host "🔨 2. BUILD & DEPLOY TRÊN VPS..." -ForegroundColor Yellow
Write-Host "----------------------------"

$commands = @"
cd $VPS_PATH
echo '📦 Building frontend...'
npm run build
echo '⚙️ Restarting backend...'
pm2 restart floral-backend
echo '🌐 Reloading Nginx...'
sudo systemctl reload nginx
echo '✅ Deploy hoàn tất!'
pm2 status
"@

ssh "${VPS_USER}@${VPS_IP}" $commands

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ HOÀN TẤT!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Truy cập: http://$VPS_IP" -ForegroundColor Cyan
Write-Host ""
