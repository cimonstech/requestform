#!/bin/bash
# Deployment script for VPS
# Usage: ./deploy.sh

echo "🚀 Starting deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building application..."
npm run build

# Restart PM2 process
echo "🔄 Restarting application..."
pm2 restart azmon-request-form || pm2 start npm --name "azmon-request-form" -- start:3001

# Show status
echo "✅ Deployment complete!"
echo "📊 Application status:"
pm2 status

echo "📝 View logs with: pm2 logs azmon-request-form"

