# Vercel Deployment Guide

This guide will help you deploy the Equipment Request Form to Vercel.

## ⚠️ Important: Storage Requirement

**The current file-based storage (`.request-store.json`) will NOT work on Vercel** because:
- Vercel uses serverless functions (stateless)
- Files written to the filesystem are ephemeral and don't persist
- Each function invocation may be on a different server

### Recommended Solutions:

1. **Vercel KV (Redis)** - Free tier available, easy to set up
2. **Supabase** - Free PostgreSQL database
3. **MongoDB Atlas** - Free tier available
4. **PlanetScale** - Free MySQL database

For now, the app will work but data won't persist across deployments. You'll need to migrate to a database for production.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your GitHub repository connected to Vercel
3. SMTP credentials for email sending

## Step 1: Push to GitHub

Make sure your code is pushed to GitHub:

```bash
git push origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### Option B: Via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production:
```bash
vercel --prod
```

## Step 3: Configure Environment Variables

In your Vercel project dashboard, go to **Settings → Environment Variables** and add:

### Required Variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
NEXT_PUBLIC_BASE_URL=https://your-project.vercel.app
```

### For Gmail:
- Enable 2-factor authentication
- Generate an App Password: [Google Account Settings](https://myaccount.google.com/apppasswords)
- Use the App Password (not your regular password)

## Step 4: Build Settings

Vercel will auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`

## Step 5: Deploy

Click "Deploy" and wait for the build to complete.

## Step 6: Update Base URL

After deployment, update `NEXT_PUBLIC_BASE_URL` in Vercel environment variables to your actual domain.

## Troubleshooting

### Build Errors

1. **Canvas library issues**: The `canvas` library requires native dependencies. Vercel should handle this automatically, but if you get errors, you may need to add build settings.

2. **Environment variables not working**: Make sure to:
   - Add variables in Vercel dashboard
   - Redeploy after adding variables
   - Use `NEXT_PUBLIC_` prefix for client-side variables

### Runtime Errors

1. **File storage not working**: This is expected. You need to migrate to a database (see storage requirement above).

2. **Email sending fails**: 
   - Check SMTP credentials
   - Verify environment variables are set
   - Check Vercel function logs

## Next Steps

1. **Set up a database** (Vercel KV, Supabase, etc.)
2. **Update `utils/requestStore.ts`** to use the database instead of file storage
3. **Test the deployment** thoroughly
4. **Set up a custom domain** (optional)

## Support

For Vercel-specific issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)

