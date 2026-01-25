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
echo "[1/7] Updating system packages..."
apt update && apt upgrade -y

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

echo ""
echo "================================================"
echo "  WEB SERVER SETUP COMPLETE!"
echo "================================================"
echo ""
echo "Web Server IP: ${WEB_SERVER_IP}"
echo ""
echo "Next steps:"
echo ""
echo "1. Copy your project files to /var/www/lms/"
echo "   - Backend: /var/www/lms/backend/"
echo "   - Frontend: /var/www/lms/frontend/"
echo ""
echo "2. Install backend dependencies:"
echo "   cd /var/www/lms/backend && npm install"
echo ""
echo "3. Build frontend with correct API URL:"
echo "   cd /var/www/lms/frontend"
echo "   echo 'VITE_API_URL=http://${WEB_SERVER_IP}/api' > .env"
echo "   npm install && npm run build"
echo ""
echo "4. Start the backend with PM2:"
echo "   cd /var/www/lms/backend"
echo "   pm2 start server.js --name lms-api"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Access your app at: http://${WEB_SERVER_IP}"
echo "================================================"
