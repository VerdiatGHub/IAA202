#!/bin/bash
# ============================================
# VM 1: WEB SERVER SETUP SCRIPT
# Ubuntu Server 22.04 LTS
# ============================================
# Run as root or with sudo

echo "================================================"
echo "  LMS Web Server Setup - Ubuntu Server"
echo "================================================"

# Update system
echo "[1/5] Updating system packages..."
apt update && apt upgrade -y

# Configure Static IP (Host-Only Adapter - enp0s8)
echo "Configuring Static IP (192.168.56.101)..."
cat > /etc/netplan/99-lms-static.yaml <<EOF
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s8:
      dhcp4: no
      addresses:
        - 192.168.56.101/24
EOF
chmod 600 /etc/netplan/99-lms-static.yaml
netplan apply
echo "Waiting for network to apply..."
sleep 5

# Install Node.js 20 LTS
echo "[2/7] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx
echo "[3/7] Installing Nginx..."
apt install -y nginx

# Install Git
echo "[4/7] Installing Git..."
apt install -y git

# Create app directory
echo "[5/7] Setting up application directory..."
mkdir -p /var/www/lms
chown -R $USER:$USER /var/www/lms

# Get database server IP
DB_SERVER_IP="192.168.56.102"
DB_PASSWORD="admin123"
# read -p "Enter the Database Server VM IP address: " DB_SERVER_IP
# read -p "Enter the database password: " DB_PASSWORD

# Create backend .env file
echo "[6/7] Creating backend configuration..."
cat > /var/www/lms/backend/.env << EOF
# Database Configuration (Remote Database Server)
DB_HOST=${DB_SERVER_IP}
DB_PORT=5432
DB_NAME=lms_db
DB_USER=lms_user
DB_PASSWORD=${DB_PASSWORD}

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

# Get the local IP (Prioritize 192.168.x.x for Host-Only, fallback to first IP)
WEB_SERVER_IP=$(hostname -I | grep -oE '192\.168\.[0-9]+\.[0-9]+' | head -n 1)
if [ -z "$WEB_SERVER_IP" ]; then
    WEB_SERVER_IP=$(hostname -I | awk '{print $1}')
fi

# Frontend URL (for CORS)
FRONTEND_URL=http://${WEB_SERVER_IP}
EOF

# Configure Nginx
echo "[7/7] Configuring Nginx..."
cat > /etc/nginx/sites-available/lms << EOF
server {
    listen 80;
    server_name ${WEB_SERVER_IP};

    # Frontend - Serve React build
    location / {
        root /var/www/lms/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API - Proxy to Node.js
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/lms /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Install PM2 for process management
npm install -g pm2

# Configure firewall
ufw allow 'Nginx HTTP'
ufw allow 80
ufw allow 5000

# Clone Repository
echo "[8/8] Cloning & Deploying Application..."
rm -rf ~/IAA202
git clone https://github.com/VerdiatGHub/IAA202.git ~/IAA202

# Deploy Backend
echo "--- Deploying Backend ---"
cp -r ~/IAA202/lms-backend/* /var/www/lms/backend/
cd /var/www/lms/backend
npm install
pm2 start server.js --name lms-api
pm2 save
pm2 startup | bash

# Deploy Frontend
echo "--- Deploying Frontend ---"
mkdir -p /var/www/lms/frontend/dist
cp -r ~/IAA202/lms-frontend/* /var/www/lms/frontend/
cd /var/www/lms/frontend
echo "VITE_API_URL=http://${WEB_SERVER_IP}/api" > .env
npm install
npm run build
cp -r dist/* /var/www/lms/frontend/dist/

echo ""
echo "================================================"
echo "  WEB SERVER SETUP COMPLETE!"
echo "================================================"
echo ""
echo "Web Server IP: ${WEB_SERVER_IP}"
echo "App URL: http://${WEB_SERVER_IP}"
echo ""
echo "Automated Actions Taken:"
echo "1. Nginx, Node, Git, PM2 Installed"
echo "2. Static IP set to 192.168.56.101"
echo "3. Repo cloned to ~/IAA202"
echo "4. Backend Installed & Started (Port 5000)"
echo "5. Frontend Built & Deployed (Port 80)"
echo ""
echo "================================================"
