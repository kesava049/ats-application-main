# Contabo VPS Deployment Guide

This guide will help you deploy your ATS Frontend to your Contabo VPS server.

## Prerequisites

- Contabo VPS server running Ubuntu/Debian
- SSH access to your server
- Your frontend code ready for deployment

## Server Information

- **Server IP**: 147.93.155.233
- **Frontend Port**: 3001
- **Node.js Backend**: 147.93.155.233:5000
- **Python Backend**: 147.93.155.233:8000

## Deployment Steps

### 1. Prepare Your Local Machine

On your MacBook, make sure you're in the frontend directory:

```bash
cd /Users/kesav/Desktop/ats-application-main/ats-frontend-main
```

### 2. Upload Files to Contabo Server

Upload your frontend code to the server:

```bash
# Using SCP to upload the entire frontend directory
scp -r . root@147.93.155.233:/tmp/ats-frontend-main/

# Or using rsync (recommended)
rsync -avz --exclude node_modules --exclude .next . root@147.93.155.233:/tmp/ats-frontend-main/
```

### 3. Connect to Your Contabo Server

```bash
ssh root@147.93.155.233
```

### 4. Run the Deployment Script

On your Contabo server:

```bash
cd /tmp/ats-frontend-main
chmod +x deploy-contabo.sh
./deploy-contabo.sh
```

### 5. Verify Deployment

After the script completes, test your application:

```bash
# Check if the application is running
pm2 status

# Check nginx status
systemctl status nginx

# Test the application
curl http://147.93.155.233
```

## What the Script Does

The deployment script will:

1. **Install Dependencies**:
   - Node.js 18
   - PM2 process manager
   - Nginx web server

2. **Configure Application**:
   - Create application directory at `/opt/ats-frontend`
   - Install npm dependencies
   - Build the Next.js application
   - Create environment variables

3. **Set Up Process Management**:
   - Configure PM2 to run your app
   - Create systemd service for auto-start
   - Set up log rotation

4. **Configure Web Server**:
   - Set up Nginx reverse proxy
   - Configure firewall rules
   - Enable the site

## Access Your Application

Once deployed, your application will be accessible at:
- **Main URL**: http://147.93.155.233
- **Direct Port**: http://147.93.155.233:3001

## Management Commands

### PM2 Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs ats-frontend

# Restart application
pm2 restart ats-frontend

# Stop application
pm2 stop ats-frontend

# Start application
pm2 start ats-frontend
```

### Nginx Commands
```bash
# Test configuration
nginx -t

# Reload configuration
systemctl reload nginx

# Restart nginx
systemctl restart nginx

# Check status
systemctl status nginx
```

### System Service Commands
```bash
# Start service
systemctl start ats-frontend

# Stop service
systemctl stop ats-frontend

# Restart service
systemctl restart ats-frontend

# Check status
systemctl status ats-frontend
```

## Troubleshooting

### If the application doesn't start:
1. Check PM2 logs: `pm2 logs ats-frontend`
2. Check system logs: `journalctl -u ats-frontend -f`
3. Verify port 3001 is not in use: `netstat -tlnp | grep 3001`

### If nginx doesn't work:
1. Test configuration: `nginx -t`
2. Check nginx logs: `tail -f /var/log/nginx/error.log`
3. Verify nginx is running: `systemctl status nginx`

### If you can't access the application:
1. Check firewall: `ufw status`
2. Verify port is open: `netstat -tlnp | grep :80`
3. Test locally: `curl localhost:3001`

## Environment Variables

The deployment script creates a `.env.local` file with these variables:

```env
NEXT_PUBLIC_NODE_API_URL=http://147.93.155.233:5000
NEXT_PUBLIC_PYTHON_API_URL=http://147.93.155.233:8000
NEXT_PUBLIC_FRONTEND_URL=http://147.93.155.233:3001
NODE_ENV=production
PORT=3001
```

## Security Notes

- The script configures UFW firewall
- Only necessary ports are opened (22, 80, 443, 3001)
- Consider setting up SSL certificates for production use
- Regularly update your system packages

## Next Steps

1. **Set up SSL Certificate** (optional):
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d your-domain.com
   ```

2. **Configure Domain** (if you have one):
   - Point your domain to 147.93.155.233
   - Update nginx configuration

3. **Set up Monitoring**:
   - Configure log monitoring
   - Set up uptime monitoring
   - Configure alerts

4. **Backup Strategy**:
   - Set up regular backups of your application
   - Backup your database
   - Test restore procedures
