# VPS Deployment Guide

## Deployment to VPS (72.62.4.222)

### Subdomain: azmon.cimonstech.cloud

**✅ VPS is the recommended deployment option** - File-based storage works perfectly on VPS (unlike serverless platforms like Vercel where it won't persist).

## Prerequisites

1. Node.js 18+ installed on VPS
2. PM2 or similar process manager
3. Nginx configured for reverse proxy
4. Domain DNS pointing to VPS IP (72.62.4.222)
5. **Note:** This deployment uses subdomain `azmon.cimonstech.cloud` and will NOT affect existing apps on the VPS (like ventechgadgets.com)

## Step 1: Prepare the Application

1. Build the application:
```bash
npm run build
```

2. Create production `.env` file:

**Option 1: Using nano (recommended for beginners):**
```bash
cd /var/www/azmon-request-form
nano .env
```

Then paste the following content:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
NEXT_PUBLIC_BASE_URL=https://azmon.cimonstech.cloud
NODE_ENV=production
```

**To save in nano:**
- Press `Ctrl + O` (to write/out)
- Press `Enter` (to confirm filename)
- Press `Ctrl + X` (to exit)

**Option 2: Using vi/vim:**
```bash
cd /var/www/azmon-request-form
vi .env
```

Then:
- Press `i` to enter insert mode
- Paste the content above
- Press `Esc` to exit insert mode
- Type `:wq` and press `Enter` to save and quit

**Option 3: Using echo (quick method):**
```bash
cd /var/www/azmon-request-form
cat > .env << 'EOF'
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
NEXT_PUBLIC_BASE_URL=https://azmon.cimonstech.cloud
NODE_ENV=production
EOF
```

**Important:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `your-app-password` with your Gmail App Password (not your regular password)
- Make sure `NEXT_PUBLIC_BASE_URL` matches your actual domain
- The app defaults to port 465 (SSL) which is more reliable. If you need to use 587, set `SMTP_PORT=587`

## Step 2: Deploy to VPS

### Option A: Using Git (Recommended)

1. Push code to Git repository
2. SSH into VPS:
```bash
ssh user@72.62.4.222
```

3. Clone repository:
```bash
cd /var/www
git clone <your-repo-url> azmon-request-form
cd azmon-request-form
```

4. Install dependencies:
```bash
npm install --production
```

5. Create `.env` file with production values

6. Build the application:
```bash
npm run build
```

### Option B: Direct Upload

1. Upload project files to VPS (using SCP, FTP, etc.)
2. SSH into VPS and navigate to project directory
3. Install dependencies and build as above

## Step 3: Setup PM2 Process Manager

1. Install PM2 globally (if not installed):
```bash
npm install -g pm2
```

2. Start the application on port 3001 (to avoid conflicts with other apps):
```bash
pm2 start npm --name "azmon-request-form" -- start:3001
```

**Note:** Using port 3001 to avoid conflicts with other applications on the VPS (like ventechgadgets.com). The app will run independently on the `azmon.cimonstech.cloud` subdomain.

3. Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

4. Check status:
```bash
pm2 status
pm2 logs azmon-request-form
```

## Step 4: Configure Nginx

Create or update Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/azmon.cimonstech.cloud
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name azmon.cimonstech.cloud;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Important:** 
- This configuration only affects `azmon.cimonstech.cloud` subdomain
- Your existing `ventechgadgets.com` configuration remains untouched
- The app runs on port 3001 to avoid conflicts with other apps

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/azmon.cimonstech.cloud /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 5: Setup SSL with Let's Encrypt

1. Install Certbot:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

2. Obtain SSL certificate:
```bash
sudo certbot --nginx -d azmon.cimonstech.cloud
```

3. Certbot will automatically update Nginx configuration for HTTPS

## Step 6: Verify Configuration

The email recipients are already configured to send to:
- ddickson@azmonlimited.com
- kanfram@gmail.com
- chasetetteh3@gmail.com

No changes needed unless you want to modify recipients.

## Monitoring & Maintenance

### View logs:
```bash
pm2 logs azmon-request-form
```

### Restart application:
```bash
pm2 restart azmon-request-form
```

### Stop application:
```bash
pm2 stop azmon-request-form
```

### Update application:
```bash
git pull
npm install --production
npm run build
pm2 restart azmon-request-form
```

## Troubleshooting

1. **Port 3001 not accessible**: Check firewall settings (ensure port 3001 is open)
2. **Nginx 502 error**: Check if Next.js app is running on port 3001: `pm2 logs azmon-request-form`
3. **Port conflict**: If 3001 is also in use, change to another port (3002, 3003, etc.) and update both PM2 command and Nginx config
3. **Email not sending**: Verify SMTP credentials in `.env`
4. **SSL issues**: Ensure DNS is properly configured and pointing to VPS IP

## Notes

- ✅ **File-based storage works on VPS**: The `.request-store.json` file will persist across server restarts on a VPS (unlike Vercel where it won't work)
- ✅ **Email recipients**: Already configured to send to all three recipients (ddickson@azmonlimited.com, kanfram@gmail.com, chasetetteh3@gmail.com)
- ✅ **PWA icons**: Icon files are included in the repository
- Monitor PM2 logs regularly for any errors
- The application uses port 3000 by default - ensure it's not blocked by firewall

