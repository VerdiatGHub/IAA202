#!/bin/bash
# ============================================
# VM 2: DATABASE SERVER SETUP SCRIPT
# Ubuntu Server 22.04 LTS
# ============================================
# Run as root or with sudo

set -euo pipefail

echo "================================================"
echo "  LMS Database Server Setup - Ubuntu Server"
echo "================================================"

APP_USER=${SUDO_USER:-$USER}
APP_HOME=$(getent passwd "$APP_USER" | cut -d: -f6)
if [ -z "$APP_HOME" ]; then
    APP_HOME="/home/$APP_USER"
fi
STATIC_IP=192.168.56.102
INTERFACE=${INTERFACE:-enp0s8}
WEB_SERVER_IP=192.168.56.101
DB_PASSWORD=admin123
REPO_URL=${REPO_URL:-https://github.com/VerdiatGHub/IAA202.git}

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

# Install PostgreSQL
echo "[2/5] Installing PostgreSQL 16..."
install -d /etc/apt/keyrings
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg
echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list
apt update
apt install -y postgresql-16 postgresql-contrib-16

# Start and enable PostgreSQL
echo "[3/5] Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql

# Configure PostgreSQL for remote connections
echo "[4/5] Configuring PostgreSQL for remote access..."

# Backup original configs
cp /etc/postgresql/16/main/postgresql.conf /etc/postgresql/16/main/postgresql.conf.backup
cp /etc/postgresql/16/main/pg_hba.conf /etc/postgresql/16/main/pg_hba.conf.backup

# Allow listening on all interfaces
sed -i "s/^#\?listen_addresses.*/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf

# Allow connections from web server IP
if ! grep -q "host    lms_db    lms_user    ${WEB_SERVER_IP}/32    scram-sha-256" /etc/postgresql/16/main/pg_hba.conf; then
    echo "host    lms_db    lms_user    ${WEB_SERVER_IP}/32    scram-sha-256" >> /etc/postgresql/16/main/pg_hba.conf
fi

# Restart PostgreSQL
systemctl restart postgresql

# Create database and user
echo "[5/5] Creating database and user..."
echo ""

sudo -u postgres psql --set ON_ERROR_STOP=1 << EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'lms_user') THEN
      CREATE USER lms_user WITH PASSWORD '${DB_PASSWORD}';
   END IF;
END
\$\$;
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lms_db') THEN
      CREATE DATABASE lms_db OWNER lms_user;
   END IF;
END
\$\$;
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;
\c lms_db
GRANT ALL ON SCHEMA public TO lms_user;
EOF

# Install Git and Clone Repository
echo "[5.5/6] Cloning Repository..."
apt install -y git
if [ -d ~/IAA202/.git ]; then
    git -C ~/IAA202 pull --ff-only
else
    git clone "$REPO_URL" ~/IAA202
fi

# Run schema.sql
echo "[6/6] Importing Database Schema..."
export PGPASSWORD="${DB_PASSWORD}"
psql -h localhost -U lms_user -d lms_db -f ~/IAA202/lms-backend/schema.sql

# Configure firewall
echo "Configuring firewall..."
ufw allow OpenSSH
ufw allow from ${WEB_SERVER_IP} to any port 5432
ufw --force enable

# Show info
DB_SERVER_IP=$(hostname -I | grep -oE '192\.168\.[0-9]+\.[0-9]+' | head -n 1)
if [ -z "$DB_SERVER_IP" ]; then
    DB_SERVER_IP=$(hostname -I | awk '{print $1}')
fi
systemctl is-active --quiet postgresql
echo ""
echo "================================================"
echo "  DATABASE SERVER SETUP COMPLETE!"
echo "================================================"
echo ""
echo "Database Server IP: ${DB_SERVER_IP}"
echo ""
echo "Automated Actions Taken:"
echo "1. Postgres Installed & Configured"
echo "2. Static IP set to 192.168.56.102"
echo "3. Repo cloned to ~/IAA202"
echo "4. Database Schema (schema.sql) Imported"
echo ""
echo "================================================"
