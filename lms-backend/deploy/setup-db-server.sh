#!/bin/bash
# ============================================
# VM 2: DATABASE SERVER SETUP SCRIPT
# Ubuntu Server 22.04 LTS
# ============================================
# Run as root or with sudo

echo "================================================"
echo "  LMS Database Server Setup - Ubuntu Server"
echo "================================================"

# Update system
echo "[1/5] Updating system packages..."
apt update && apt upgrade -y

# Configure Static IP (Host-Only Adapter - enp0s8)
echo "Configuring Static IP (192.168.56.102)..."
cat > /etc/netplan/99-lms-static.yaml <<EOF
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s8:
      dhcp4: no
      addresses:
        - 192.168.56.102/24
EOF
chmod 600 /etc/netplan/99-lms-static.yaml
netplan apply
echo "Waiting for network to apply..."
sleep 5

# Install PostgreSQL
echo "[2/5] Installing PostgreSQL 16..."
apt install -y wget gnupg2
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-16 postgresql-contrib-16

# Start and enable PostgreSQL
echo "[3/5] Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql

# Configure PostgreSQL for remote connections
echo "[4/5] Configuring PostgreSQL for remote access..."

# Web Server IP (Hardcoded)
WEB_SERVER_IP="192.168.56.101"

# Backup original configs
cp /etc/postgresql/16/main/postgresql.conf /etc/postgresql/16/main/postgresql.conf.backup
cp /etc/postgresql/16/main/pg_hba.conf /etc/postgresql/16/main/pg_hba.conf.backup

# Allow listening on all interfaces
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/16/main/postgresql.conf

# Allow connections from web server IP
echo "# Allow LMS Web Server" >> /etc/postgresql/16/main/pg_hba.conf
echo "host    lms_db    lms_user    ${WEB_SERVER_IP}/32    scram-sha-256" >> /etc/postgresql/16/main/pg_hba.conf

# Restart PostgreSQL
systemctl restart postgresql

# Create database and user
echo "[5/5] Creating database and user..."
DB_PASSWORD="admin123"
echo ""

sudo -u postgres psql << EOF
-- Create the database user
CREATE USER lms_user WITH PASSWORD '${DB_PASSWORD}';

-- Create the database
CREATE DATABASE lms_db OWNER lms_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE lms_db TO lms_user;

-- Connect to lms_db and grant schema privileges
\c lms_db
GRANT ALL ON SCHEMA public TO lms_user;
EOF

# Install Git and Clone Repository
echo "[5.5/6] Cloning Repository..."
apt install -y git
rm -rf ~/IAA202
git clone https://github.com/VerdiatGHub/IAA202.git ~/IAA202

# Run schema.sql
echo "[6/6] Importing Database Schema..."
export PGPASSWORD='admin123'
psql -h localhost -U lms_user -d lms_db -f ~/IAA202/lms-backend/schema.sql || echo "Schema import failed (maybe already exists?)"

# Configure firewall
echo "Configuring firewall..."
ufw allow from ${WEB_SERVER_IP} to any port 5432

# Show info
DB_SERVER_IP=$(hostname -I | grep -oE '192\.168\.[0-9]+\.[0-9]+' | head -n 1)
if [ -z "$DB_SERVER_IP" ]; then
    DB_SERVER_IP=$(hostname -I | awk '{print $1}')
fi
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
