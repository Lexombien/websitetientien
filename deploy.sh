#!/bin/bash

# 🚀 Auto Deploy Script for Vultr VPS
# Run this script ON THE VPS after uploading code

echo "========================================="
echo "🚀 Floral Shop Auto Deploy Script"
echo "   Node.js 22 LTS Required"
echo "========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Please run as root: sudo bash deploy.sh${NC}"
  exit 1
fi

# Check Node.js version
echo -e "${BLUE}🔍 Checking Node.js version...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed!${NC}"
    echo -e "${YELLOW}Install it with:${NC}"
    echo "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -"
    echo "apt install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
echo -e "${BLUE}📦 Current Node.js version: $(node -v)${NC}"

if [ "$NODE_VERSION" -lt 22 ]; then
    echo -e "${YELLOW}⚠️  Warning: Node.js $NODE_VERSION detected. Recommended: v22+${NC}"
    echo -e "${YELLOW}Upgrade with:${NC}"
    echo "curl -fsSL https://deb.nodesource.com/setup_22.x | bash -"
    echo "apt install -y nodejs"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Node.js version OK (v$NODE_VERSION)${NC}"
fi

echo -e "${YELLOW}📦 Step 1: Installing dependencies...${NC}"
cd /var/www/floral-shop || exit

# Install npm packages
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🏗️  Step 2: Building production...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📁 Step 3: Setting up folders...${NC}"
mkdir -p uploads
if [ ! -f database.json ]; then
    echo '{"products":[],"categories":[],"settings":{},"categorySettings":{},"media":{}}' > database.json
    echo -e "${GREEN}✅ Created database.json${NC}"
fi

# Set permissions
chmod -R 755 uploads
chown -R www-data:www-data uploads
echo -e "${GREEN}✅ Permissions set${NC}"

echo ""
echo -e "${YELLOW}⚙️  Step 4: Managing PM2 process...${NC}"
# Stop existing process if any
pm2 delete floral-backend 2>/dev/null

# Start new process
pm2 start server.js --name floral-backend
pm2 save

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PM2 process started${NC}"
else
    echo -e "${RED}❌ Failed to start PM2${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🌐 Step 5: Configuring Nginx...${NC}"
# Check if nginx config exists
if [ ! -f /etc/nginx/sites-available/floral-shop ]; then
    echo -e "${YELLOW}Creating Nginx config...${NC}"
    cat > /etc/nginx/sites-available/floral-shop << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        root /var/www/floral-shop/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(jpg|jpeg|png|gif|ico|css|js|webp)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /uploads {
        alias /var/www/floral-shop/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/floral-shop /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    echo -e "${GREEN}✅ Nginx config created${NC}"
fi

# Test and reload Nginx
nginx -t
if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${RED}❌ Nginx config error${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔥 Step 6: Configuring firewall...${NC}"
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"

echo ""
echo "========================================="
echo -e "${GREEN}🎉 DEPLOY SUCCESSFUL!${NC}"
echo "========================================="
echo ""
echo "📊 Status Check:"
echo "----------------------------------------"
pm2 status
echo ""
echo "🌐 Access your site at:"
echo "   http://$(curl -s ifconfig.me)"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 logs floral-backend  - View logs"
echo "   pm2 restart floral-backend  - Restart backend"
echo "   nginx -t  - Test Nginx config"
echo "   systemctl restart nginx  - Restart Nginx"
echo ""
