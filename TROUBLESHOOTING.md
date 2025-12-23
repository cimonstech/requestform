# Email Troubleshooting Guide

## Common SMTP Connection Errors

### Error: "Greeting never received" / ETIMEDOUT

This error indicates the SMTP server is not responding. Here are solutions:

#### 1. Check Your `.env.local` File

Make sure your `.env.local` file exists and has correct values:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### 2. Gmail App Password Setup

If using Gmail, you **MUST** use an App Password, not your regular password:

1. Go to your Google Account: https://myaccount.google.com/
2. Enable 2-Step Verification (if not already enabled)
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Use this 16-character password in your `.env.local` file

#### 3. Check Firewall/Network

- Ensure port 587 (or 465 for SSL) is not blocked
- Check if your network/firewall allows SMTP connections
- Try from a different network to rule out network issues

#### 4. Try Different SMTP Settings

**For Gmail with SSL (Port 465):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
```

**For Gmail with TLS (Port 587) - Recommended:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### 5. Alternative Email Services

If Gmail doesn't work, try other services:

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASSWORD=your-mailgun-password
```

**Outlook/Office365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

#### 6. Test SMTP Connection

You can test your SMTP settings using a simple Node.js script:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP Error:', error);
  } else {
    console.log('SMTP Server is ready to send emails');
  }
});
```

#### 7. Restart Development Server

After updating `.env.local`, **always restart** your Next.js dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

#### 8. Check Console Logs

The application now includes connection verification. Check your server console for:
- "SMTP server is ready to send emails" - Connection successful
- "SMTP connection verification failed" - Connection failed with details

## Still Having Issues?

1. **Verify credentials are correct** - Double-check username and password
2. **Check email service status** - Gmail/SendGrid might be experiencing issues
3. **Try from production** - Some networks block SMTP from localhost
4. **Check spam folder** - Emails might be sent but marked as spam
5. **Use a dedicated email service** - Consider SendGrid, Mailgun, or AWS SES for production

