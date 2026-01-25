#!/bin/bash
# ============================================
# VM 1: WEB SERVER SETUP SCRIPT
# Ubuntu Server 22.04 LTS
# ============================================
# Run as root or with sudo

set -euo pipefail

echo "================================================"
echo "  LMS Web Server Setup - Ubuntu Server"
echo "================================================"

cd /

APP_USER=${SUDO_USER:-$USER}
APP_HOME=$(getent passwd "$APP_USER" | cut -d: -f6)
if [ -z "$APP_HOME" ]; then
    APP_HOME="/home/$APP_USER"
fi
STATIC_IP=192.168.56.101
INTERFACE=${INTERFACE:-enp0s8}
DB_SERVER_IP=192.168.56.102
DB_PASSWORD=admin123
REPO_URL=${REPO_URL:-https://github.com/VerdiatGHub/IAA202.git}
WEB_SERVER_IP=192.168.56.101
REPO_DIR="${APP_HOME}/IAA202"

# Update system
echo "[1/5] Updating system packages..."
apt update && apt upgrade -y
apt install -y curl wget gnupg2 ca-certificates software-properties-common

# Configure Static IP (Host-Only Adapter - enp0s8)
echo "Configuring Static IP (${STATIC_IP})..."
cat > /etc/netplan/99-lms-static.yaml <<EOF
network:
  version: 2
  renderer: networkd
  ethernets:
    ${INTERFACE}:
      dhcp4: no
      addresses:
        - ${STATIC_IP}/24
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
install -d /var/www/lms/backend /var/www/lms/frontend /var/www/lms/frontend/dist
chown -R "$APP_USER":"$APP_USER" /var/www/lms

JWT_SECRET_VALUE=""
if [ -f /var/www/lms/backend/.env ]; then
    JWT_SECRET_VALUE=$(grep -E "^JWT_SECRET=" /var/www/lms/backend/.env | head -n 1 | cut -d= -f2-)
fi
if [ -z "$JWT_SECRET_VALUE" ]; then
    JWT_SECRET_VALUE=$(openssl rand -base64 32)
fi

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
JWT_SECRET=${JWT_SECRET_VALUE}
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=production

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
nginx -t
systemctl enable --now nginx
systemctl reload nginx

# Install PM2 for process management
npm install -g pm2

# Configure firewall
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

# Clone Repository
echo "[8/8] Cloning & Deploying Application..."
if [ -d "${REPO_DIR}/.git" ]; then
    git -C "$REPO_DIR" pull --ff-only
else
    git clone "$REPO_URL" "$REPO_DIR"
fi

# Deploy Backend
echo "--- Deploying Backend ---"
cp -r "$REPO_DIR/lms-backend/"* /var/www/lms/backend/
chown -R "$APP_USER":"$APP_USER" /var/www/lms/backend
sudo -u "$APP_USER" -H bash -c "cd /var/www/lms/backend && npm install"
sudo -u "$APP_USER" -H bash -c "cd /var/www/lms/backend && pm2 start server.js --name lms-api"
sudo -u "$APP_USER" -H pm2 save
pm2 startup systemd -u "$APP_USER" --hp "$APP_HOME" | bash

# Deploy Frontend
echo "--- Deploying Frontend ---"
mkdir -p /var/www/lms/frontend/dist
cp -r "$REPO_DIR/lms-frontend/"* /var/www/lms/frontend/
chown -R "$APP_USER":"$APP_USER" /var/www/lms/frontend
sudo -u "$APP_USER" -H bash -c "cd /var/www/lms/frontend && echo \"VITE_API_URL=http://${WEB_SERVER_IP}/api\" > .env"
sudo -u "$APP_USER" -H bash -c "cd /var/www/lms/frontend && npm install"
sudo -u "$APP_USER" -H bash -c "cd /var/www/lms/frontend && npm run build"
cp -r /var/www/lms/frontend/dist/* /var/www/lms/frontend/dist/

systemctl is-active --quiet nginx
sudo -u "$APP_USER" -H pm2 list >/dev/null
curl -fsS http://localhost/ >/dev/null

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
