#!/bin/bash

# CryptoViz Frontend Deployment Script
# This script deploys the built frontend to the VPS

set -e

echo "Starting deployment..."

# Configuration
VPS_HOST="${VPS_HOST:-165.22.196.162}"
VPS_USER="${VPS_USER:-root}"
DEPLOY_PATH="/root/Projects/frontend"

# Build the project
echo "Building project..."
npm run build

# Deploy to VPS
echo "Deploying to VPS..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  dist/ "${VPS_USER}@${VPS_HOST}:${DEPLOY_PATH}/"

# Create deployment info
ssh "${VPS_USER}@${VPS_HOST}" "echo 'Deployed at: $(date)' > ${DEPLOY_PATH}/deployment-info.txt"

# Reload nginx if running
echo "Reloading nginx..."
ssh "${VPS_USER}@${VPS_HOST}" "
  if systemctl is-active --quiet nginx; then
    sudo nginx -t && sudo systemctl reload nginx
    echo 'Nginx reloaded successfully'
  else
    echo 'Nginx is not running'
  fi
"

echo "Deployment completed successfully!"
echo "Visit your site at: http://${VPS_HOST}"
