# Deployment Guide

## Deployment to VPS (72.62.4.222)

### Subdomain: azmon.cimonstech.cloud

## Prerequisites

1. Node.js 18+ installed on VPS
2. PM2 or similar process manager
3. Nginx configured for reverse proxy
4. Domain DNS pointing to VPS IP (72.62.4.222)

## Step 1: Prepare the Application

1. Build the application:
```bash
npm run build
```

2. Create production `.env` file with:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
NEXT_PUBLIC_BASE_URL=https://azmon.cimonstech.cloud
```

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

2. Start the application:
```bash
pm2 start npm --name "azmon-request-form" -- start
```

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
        proxy_pass http://localhost:3000;
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

## Step 6: Update Email Recipients

After testing, update `app/api/send-email/route.ts`:
```typescript
const RECIPIENT_EMAILS = [
  'ddickson@azmonlimited.com',
  'kanfram@gmail.com',
  'chasetetteh3@gmail.com'
]
```

Then rebuild:
```bash
npm run build
pm2 restart azmon-request-form
```

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

1. **Port 3000 not accessible**: Check firewall settings
2. **Nginx 502 error**: Check if Next.js app is running on port 3000
3. **Email not sending**: Verify SMTP credentials in `.env`
4. **SSL issues**: Ensure DNS is properly configured and pointing to VPS IP

## Notes

- The in-memory request store will reset on server restart. Consider implementing a database for production.
- Replace PWA icons with actual images before deployment.
- Monitor PM2 logs regularly for any errors.

