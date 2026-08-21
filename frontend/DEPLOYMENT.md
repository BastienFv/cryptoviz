# CryptoViz Frontend - Deployment Guide

This guide will help you set up CI/CD for automatic deployment to your VPS.

## Prerequisites

- GitHub repository: `https://github.com/nikitakofman/cryptoviz-frontend.git`
- VPS: `165.22.196.162` (Ubuntu 24.04)
- Node.js and npm installed locally
- SSH access to VPS

## Setup Instructions

### 1. VPS Initial Setup (Run these commands on your VPS)

```bash
# SSH into your VPS
ssh root@165.22.196.162

# Install nginx if not already installed
sudo apt update
sudo apt install -y nginx

# The frontend directory already exists at /root/Projects/frontend
# This is where GitHub Actions will deploy the built files
# You don't need to git clone - GitHub Actions will copy the built dist/ folder here

# Copy nginx configuration
sudo nano /etc/nginx/sites-available/cryptoviz
# Paste the contents from nginx.conf file

# Enable the site
sudo ln -s /etc/nginx/sites-available/cryptoviz /etc/nginx/sites-enabled/

# Remove default nginx site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Start and enable nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Reload nginx
sudo systemctl reload nginx
```

### 2. GitHub Secrets Setup

You need to add these secrets to your GitHub repository:

1. Go to your GitHub repository: https://github.com/nikitakofman/cryptoviz-frontend
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add the following:

#### Required Secrets:

**VPS_HOST**
```
165.22.196.162
```

**VPS_USERNAME**
```
root
```

**VPS_SSH_KEY**
- Generate an SSH key on your local machine (if you don't have one):
```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/cryptoviz_deploy
```

- Copy the **private key** content:
```bash
cat ~/.ssh/cryptoviz_deploy
```

- Paste the entire private key (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`) into the GitHub secret.

- Copy the **public key** to your VPS:
```bash
ssh-copy-id -i ~/.ssh/cryptoviz_deploy.pub root@165.22.196.162
```

Or manually add it to VPS:
```bash
# On VPS
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key, save and exit
chmod 600 ~/.ssh/authorized_keys
```

### 3. Update Backend API URL

Make sure your frontend is pointing to the correct backend API. Update the API base URL in your code:

```javascript
// In src/services/api.js or similar
const API_BASE_URL = 'http://165.22.196.162:8080/api'; // or your domain
```

### 4. Deploy

#### Automatic Deployment (via GitHub Actions)

Simply push to the `main` branch:

```bash
git add .
git commit -m "Setup CI/CD"
git push origin main
```

GitHub Actions will automatically:
1. Build your React app
2. Deploy to VPS at `/root/Projects/frontend/`
3. Reload nginx

#### Manual Deployment (using deploy.sh)

You can also deploy manually from your local machine:

```bash
# Make sure you have SSH access configured
./deploy.sh
```

### 5. Verify Deployment

Visit your site:
- **Frontend:** http://165.22.196.162
- **Deployment Info:** http://165.22.196.162/deployment-info.txt

### 6. Set Up Domain (Optional)

If you have a domain name:

1. Point your domain's DNS A record to `165.22.196.162`
2. Update nginx configuration with your domain name
3. Install SSL certificate with Let's Encrypt:

```bash
# On VPS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Troubleshooting

### Check nginx status
```bash
sudo systemctl status nginx
```

### Check nginx logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Check deployment files
```bash
ls -la /root/Projects/frontend/
```

### Test nginx configuration
```bash
sudo nginx -t
```

### GitHub Actions failing?
- Check the Actions tab in your GitHub repository
- Verify all secrets are correctly set
- Make sure SSH key has proper permissions on VPS

### Permission issues?
```bash
# On VPS
sudo chown -R root:root /root/Projects/frontend
sudo chmod -R 755 /root/Projects/frontend
```

## File Structure on VPS

After deployment, your VPS should have:

```
/root/Projects/frontend/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── deployment-info.txt
```

## CI/CD Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:

1. Trigger on push to `main` branch or manual dispatch
2. Checkout code
3. Setup Node.js 20
4. Install dependencies with `npm ci`
5. Build project with `npm run build`
6. Copy `dist/` folder to VPS
7. Reload nginx on VPS
8. Create deployment timestamp file

## Next Steps

- Set up environment-specific builds (dev, staging, prod)
- Add automated testing before deployment
- Set up monitoring and alerts
- Configure SSL/HTTPS
- Set up backend CI/CD similarly
