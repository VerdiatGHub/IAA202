# LMS Self-Hosted Deployment Guide

## VirtualBox Network Setup (REQUIRED FIRST!)

Since your university WiFi blocks VM-to-VM communication, use this dual-adapter setup:

### Step 0: Create Host-Only Network in VirtualBox

1. Open **VirtualBox** → **File** → **Host Network Manager**
2. Click **Create** to add a new host-only network
3. Note the IP range (usually `192.168.56.1/24`)
4. Click **Apply** and close

### Configure BOTH VMs with 2 Network Adapters:

| Adapter | Type | Purpose |
|---------|------|---------|
| **Adapter 1** | NAT | Internet access (apt, git clone) |
| **Adapter 2** | Host-Only Adapter | VM-to-VM communication |

**In VirtualBox for each VM:**
1. Right-click VM → **Settings** → **Network**
2. **Adapter 1**: Enable, Attached to: **NAT**
3. **Adapter 2**: Enable, Attached to: **Host-only Adapter** → Select your host-only network

---

## Architecture (Host-Only Network)

```
Your Windows PC (Host)
│
├── VirtualBox Host-Only Network: 192.168.56.0/24
│   │
│   ├── VM 1: Web Server - 192.168.56.101
│   │   ├── Adapter 1: NAT (internet)
│   │   └── Adapter 2: Host-Only (192.168.56.101)
│   │
│   └── VM 2: Database Server - 192.168.56.102
│       ├── Adapter 1: NAT (internet)
│       └── Adapter 2: Host-Only (192.168.56.102)
```

---

## STEP 1: Set Up Database Server (VM 2)

### 1.1 Install Ubuntu Server 22.04 LTS

### 1.2 Configure Static IP on Host-Only Interface
```bash
# Find your network interfaces
ip a

# Edit netplan config
sudo nano /etc/netplan/00-installer-config.yaml
```

Add this configuration:
```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true  # NAT - for internet
    enp0s8:
      dhcp4: false
      addresses:
        - 192.168.56.102/24  # Host-Only - static IP for DB server
```

Apply the config:
```bash
sudo netplan apply
ip a  # Verify enp0s8 has 192.168.56.102
```

### 1.3 Run Database Setup Script
```bash
# Clone the repo (uses NAT adapter for internet)
git clone https://github.com/VerdiatGHub/IAA202.git
cd IAA202/lms-backend/deploy

# Make executable and run
chmod +x setup-db-server.sh
sudo ./setup-db-server.sh
# When prompted for Web Server IP, enter: 192.168.56.101
```

### 1.4 Import Database Schema & Fix Permissions
```bash
cd ~/IAA202/lms-backend

# Copy schema to /tmp to avoid permission issues
sudo cp schema.sql /tmp/

# Import Schema
sudo -u postgres psql -d lms_db -f /tmp/schema.sql

# ⚠️ CRITICAL: Grant Permissions to lms_user
sudo -u postgres psql -d lms_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lms_user;"
sudo -u postgres psql -d lms_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO lms_user;"
```

---

## STEP 2: Set Up Web Server (VM 1)

### 2.1 Install Ubuntu Server 22.04 LTS

### 2.2 Configure Static IP on Host-Only Interface
```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: true  # NAT - for internet
    enp0s8:
      dhcp4: false
      addresses:
        - 192.168.56.101/24  # Host-Only - static IP for Web server
```

```bash
sudo netplan apply
ip a  # Verify enp0s8 has 192.168.56.101
```

### 2.3 Test Connection to Database Server
```bash
ping 192.168.56.102  # Should succeed!
```

### 2.4 Run Web Server Setup Script
```bash
git clone https://github.com/VerdiatGHub/IAA202.git
cd IAA202/lms-backend/deploy

chmod +x setup-web-server.sh
sudo ./setup-web-server.sh
# When prompted for Database Server IP, enter: 192.168.56.102
```

### 2.5 Configure Backend
```bash
cd /var/www/lms/backend

# Edit .env to connect to database server
cat > .env << EOF
DB_HOST=192.168.56.102
DB_PORT=5432
DB_NAME=lms_db
DB_USER=lms_user
DB_PASSWORD=your_password_here
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://192.168.56.101
EOF

npm install
```

### 2.6 Build Frontend
```bash
cd /var/www/lms/frontend

# Set API URL to web server's host-only IP
echo "VITE_API_URL=http://192.168.56.101/api" > .env

npm install
npm run build

# Copy build to Nginx directory
sudo mkdir -p /var/www/lms
sudo cp -r dist/* /var/www/lms/frontend/dist/
```

### 2.7 Start Backend with PM2
```bash
cd /var/www/lms/backend
pm2 start server.js --name lms-api
pm2 save
pm2 startup  # Follow instructions
```

---

## STEP 3: Access the Application

From your **Windows host machine**, open browser:

**http://192.168.56.101**

### Default Logins:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lms.local | admin123 |
| Instructor | instructor@lms.local | admin123 |
| Student | student@lms.local | admin123 |

---

## Troubleshooting

### VMs Can't Ping Each Other
```bash
# Check both VMs have host-only adapter enabled
# Verify static IPs are set:
ip addr show enp0s8
```

### Database Connection Failed
```bash
# On Web Server
nc -zv 192.168.56.102 5432
```
If failed:
1. Check `postgresql.conf` has `listen_addresses = '*'`
2. Check `pg_hba.conf` allows `192.168.56.101`

### Permission Denied "aclcheck_error"
Run this on **Database Server**:
```bash
sudo -u postgres psql -d lms_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO lms_user;"
```
