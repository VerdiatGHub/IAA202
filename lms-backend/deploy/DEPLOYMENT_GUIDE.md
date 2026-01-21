# LMS Self-Hosted Deployment Guide

## Architecture Overview

```
┌─────────────────────────┐     ┌─────────────────────────┐
│   VM 1: Web Server      │     │   VM 2: Database Server │
│   Ubuntu Server 22.04   │     │   Ubuntu Server 22.04   │
│                         │     │                         │
│  Nginx (port 80)        │     │  PostgreSQL (5432)      │
│  Node.js API (5000)     │◄────┼──────────────────────►  │
│  React Frontend         │     │                         │
└─────────────────────────┘     └─────────────────────────┘
```

---

## STEP 1: Set Up Database Server (VM 2)

### 1.1 Install Ubuntu Server 22.04 LTS on VM 2

### 1.2 Run Setup Script
```bash
# Transfer the setup script to VM 2
scp deploy/setup-db-server.sh user@DB_SERVER_IP:~/

# SSH into VM 2 and run
ssh user@DB_SERVER_IP
chmod +x setup-db-server.sh
sudo ./setup-db-server.sh
```

### 1.3 Import Database Schema
```bash
# Transfer schema.sql to VM 2
scp schema.sql user@DB_SERVER_IP:~/

# SSH and import
ssh user@DB_SERVER_IP
psql -U lms_user -d lms_db -f schema.sql
```

### 1.4 Note These Values
- Database Server IP: `_______________`
- Database Password: `_______________`

---

## STEP 2: Set Up Web Server (VM 1)

### 2.1 Install Ubuntu Server 22.04 LTS on VM 1

### 2.2 Run Setup Script
```bash
# Transfer the setup script to VM 1
scp deploy/setup-web-server.sh user@WEB_SERVER_IP:~/

# SSH into VM 1 and run
ssh user@WEB_SERVER_IP
chmod +x setup-web-server.sh
sudo ./setup-web-server.sh
```

### 2.3 Copy Project Files
```bash
# From your Windows machine, transfer the project:

# Backend
scp -r ../lms-backend/* user@WEB_SERVER_IP:/var/www/lms/backend/

# Frontend
scp -r ../lms-frontend/* user@WEB_SERVER_IP:/var/www/lms/frontend/
```

### 2.4 Configure and Build Frontend
```bash
ssh user@WEB_SERVER_IP
cd /var/www/lms/frontend

# Set the API URL to your web server IP
echo "VITE_API_URL=http://YOUR_WEB_SERVER_IP/api" > .env

npm install
npm run build
```

### 2.5 Configure Backend
```bash
cd /var/www/lms/backend

# Edit .env with your database server details
nano .env
# Update: DB_HOST=YOUR_DATABASE_SERVER_IP

npm install
```

### 2.6 Start Backend with PM2
```bash
pm2 start server.js --name lms-api
pm2 save
pm2 startup  # Follow the instructions it gives
```

---

## STEP 3: Verify Deployment

### Test Database Connection
```bash
curl http://localhost:5000/api/health
# Should return: {"status":"ok","database":"connected",...}
```

### Test Frontend
Open browser and navigate to: `http://YOUR_WEB_SERVER_IP`

### Default Login Credentials
- **Admin**: admin@lms.local / admin123
- **Instructor**: instructor@lms.local / admin123
- **Student**: student@lms.local / admin123

---

## Troubleshooting

### Database Connection Failed
```bash
# On Web Server - test connection to DB server
nc -zv DB_SERVER_IP 5432

# On DB Server - check PostgreSQL is listening
sudo netstat -tlnp | grep 5432

# Check pg_hba.conf allows your web server IP
sudo cat /etc/postgresql/16/main/pg_hba.conf
```

### Frontend Not Loading
```bash
# Check Nginx status
sudo systemctl status nginx

# Check Nginx config
sudo nginx -t

# Check if files exist
ls -la /var/www/lms/frontend/dist/
```

### Backend API Not Responding
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs lms-api

# Restart
pm2 restart lms-api
```
