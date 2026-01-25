# How to Update Your LMS

**Good news!** You do **NOT** need to setup the VMs again.

When you make changes on your Windows computer (UI, features, etc.), follow this simple workflow:

---

## Quick Update (One-Liner)

**On Web Server (192.168.56.101):**
```bash
cd ~/IAA202 && git pull && cp -r lms-backend/* /var/www/lms/backend/ && cp -r lms-frontend/* /var/www/lms/frontend/ && cd /var/www/lms/frontend && npm run build && pm2 restart lms-api
```

---

## Step-by-Step Update

### 1. On Windows: Push Changes
```bash
git add .
git commit -m "Added new features"
git push
```

### 2. On Web Server (192.168.56.101): Pull & Update

**For Backend Changes:**
```bash
cd ~/IAA202
git pull
cp -r lms-backend/* /var/www/lms/backend/
cd /var/www/lms/backend
npm install            # Only if you added new packages
pm2 restart lms-api    # Apply changes
```

**For Frontend Changes:**
```bash
cd ~/IAA202
git pull
cp -r lms-frontend/* /var/www/lms/frontend/
cd /var/www/lms/frontend
npm install            # Only if you added new packages
npm run build
```

### 3. On Database Server (192.168.56.102): Update Schema
**Only if you changed `schema.sql`:**
```bash
cd ~/IAA202
git pull
export PGPASSWORD='admin123'
psql -h localhost -U lms_user -d lms_db -f lms-backend/schema.sql
```

⚠️ **Warning:** Running schema.sql will DROP all tables and recreate them, losing all data!

---

## What Happens When You Shut Down VMs?

### ✅ Everything Auto-Starts on Boot:

| Service | Server | Auto-Start? |
|---------|--------|-------------|
| PostgreSQL | Database (192.168.56.102) | ✅ Yes |
| PM2 (Backend API) | Web (192.168.56.101) | ✅ Yes |
| Nginx (Frontend) | Web (192.168.56.101) | ✅ Yes |

**Your LMS will be available immediately after powering on both VMs.**

### Boot Order:
1. Start **Database Server** first (192.168.56.102)
2. Then start **Web Server** (192.168.56.101)
3. Access http://192.168.56.101 in your browser

---

## Troubleshooting

**"fatal: detected dubious ownership in repository"**
If you see this error when running `git pull`, it means the permissions on the folder don't match your user. Run this command to fix it:

```bash
git config --global --add safe.directory /home/huynh/IAA202
```
Then try `git pull origin main` again.

**"error: cannot open .git/FETCH_HEAD: Permission denied"**
If you see a permission error, it means some files are owned by `root` (probably because you used `sudo` with git before). Fix it by reclaiming ownership:

```bash
sudo chown -R $USER:$USER ~/IAA202
```
Then try `git pull origin main` again.

### 4. Backend Verification (If Login Fails)

If you see "Failed to fetch" or infinite loading, check your backend logs:

1.  **Check Status:**
    ```bash
    ssh user@<web_server_ip>
    pm2 status
    ```
    Ensure `lms-api` is "online".

2.  **View Logs:**
    ```bash
    pm2 logs lms-api --lines 50
    ```
    Look for "CORS error" or "Database connection error".

3.  **Check Backend Config:**
    ```bash
    cat /var/www/lms/backend/.env
    ```
    Make sure `FRONTEND_URL` matches your actual browser URL (e.g., `http://192.168.56.101`).

