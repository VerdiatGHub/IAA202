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

# Get the web server IP (you'll need to set this)
read -p "Enter the Web Server VM IP address (e.g., 192.168.1.100): " WEB_SERVER_IP

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
read -sp "Enter password for lms_user (database user): " DB_PASSWORD
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

# Configure firewall
echo "Configuring firewall..."
ufw allow from ${WEB_SERVER_IP} to any port 5432

# Show info
DB_SERVER_IP=$(hostname -I | awk '{print $1}')
echo ""
echo "================================================"
echo "  DATABASE SERVER SETUP COMPLETE!"
echo "================================================"
echo ""
echo "Database Server IP: ${DB_SERVER_IP}"
echo "PostgreSQL Port: 5432"
echo "Database Name: lms_db"
echo "Database User: lms_user"
echo ""
echo "Next step: Run the schema.sql file:"
echo "  psql -U lms_user -d lms_db -f schema.sql"
echo ""
echo "Update your Web Server .env with:"
echo "  DB_HOST=${DB_SERVER_IP}"
echo "  DB_PORT=5432"
echo "  DB_NAME=lms_db"
echo "  DB_USER=lms_user"
echo "  DB_PASSWORD=<your_password>"
echo "================================================"
