# How to Update Your Code

**Good news!** You do **NOT** need to setup the VMs again.

When you make changes on your Windows computer (UI, features, etc.), follow this simple workflow:

### 1. On Windows: Push Changes
```bash
git add .
git commit -m "Added new features"
git push
```

### 2. On Web Server VM: Pull & Update
SSH into your Web Server (`ssh user@192.168.56.101`) and run:

**For Backend Changes:**
```bash
cd ~/IAA202/lms-backend
git pull origin main

# Update live folder
sudo cp -r ./* /var/www/lms/backend/
cd /var/www/lms/backend
npm install            # Only if you added new packages
pm2 restart lms-api    # Apply changes
```

**For Frontend Changes:**
```bash
cd ~/IAA202/lms-frontend
git pull origin main

# Rebuild
npm install            # Only if you added new packages
npm run build

# Update live files
sudo cp -r dist/* /var/www/lms/frontend/
```
