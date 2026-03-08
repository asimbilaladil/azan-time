# 🚀 VPS Deployment Guide

Complete guide to get Azan Time running on your Hetzner VPS.

---

## Prerequisites (T01 — already done)
Your VPS should already have:
- Ubuntu 24.04
- Node.js 20 (`node --version` → v20.x)
- Nginx installed and running
- PM2 installed globally
- Domain pointing to your server IP

---

## Step 1 — Install Docker & Docker Compose

```bash
ssh deploy@YOUR_SERVER_IP

# Install Docker
curl -fsSL https://get.docker.com | sudo bash
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose v2
sudo apt install -y docker-compose-plugin

# Verify
docker --version
docker compose version
```

---

## Step 2 — Clone the Repository

```bash
sudo mkdir -p /var/www/azantime
sudo chown deploy:deploy /var/www/azantime
cd /var/www/azantime

git clone https://github.com/YOUR_USERNAME/azan-time.git .
```

---

## Step 3 — Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in ALL values in `backend/.env`:

| Variable | Where to get it |
|---|---|
| `DB_PASSWORD` | Make up a strong password |
| `DB_ROOT_PASSWORD` | Make up a strong password |
| `LWA_CLIENT_ID` | Amazon Developer Console → LWA |
| `LWA_CLIENT_SECRET` | Amazon Developer Console → LWA |
| `JWT_SECRET` | Run: `openssl rand -base64 48` |
| `ENCRYPTION_KEY` | Run: `openssl rand -hex 32` |
| `ALEXA_SKILL_ID` | Alexa Developer Console |
| `ALEXA_SMART_HOME_SKILL_ID` | Alexa Developer Console |
| `CDN_BASE_URL` | `https://cdn.azantime.de` |

```bash
# Frontend
cp frontend/nextjs-app/.env.local.example frontend/nextjs-app/.env.local
# This file just needs: NEXT_PUBLIC_API_URL=https://azantime.de/api
```

---

## Step 4 — Configure Nginx

```bash
sudo cp nginx/azantime.conf /etc/nginx/sites-available/azantime
sudo ln -sf /etc/nginx/sites-available/azantime /etc/nginx/sites-enabled/azantime
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Get SSL certificate (if not done already)
sudo certbot --nginx -d azantime.de -d www.azantime.de

# Reload
sudo systemctl reload nginx
```

---

## Step 5 — Build and Start Everything

```bash
cd /var/www/azantime

# Build images and start all containers
docker compose up -d --build

# Watch logs
docker compose logs -f
```

This starts:
- `azantime-mysql` — MySQL 8 on internal network (auto-migrated from `001_init.sql`)
- `azantime-backend` — Express API on port 3000
- `azantime-frontend` — Next.js on port 3001

---

## Step 6 — Verify Everything Works

```bash
# Health check
curl https://azantime.de/health
# Expected: {"status":"ok","ts":"..."}

# Cities list
curl https://azantime.de/api/cities
# Expected: JSON array with 20 cities

# Auth redirect
curl -I https://azantime.de/api/auth/lwa
# Expected: 302 redirect to amazon.com

# Frontend
curl -I https://azantime.de/connect
# Expected: 200 OK

# Check all containers running
docker compose ps
```

---

## Step 7 — Run Backend Tests

```bash
docker compose exec backend npm test
# Expected: all tests pass
```

---

## Useful Commands

```bash
# View live logs
docker compose logs -f backend
docker compose logs -f frontend

# Restart a service
docker compose restart backend

# Enter a container shell
docker compose exec backend sh
docker compose exec mysql mysql -u azantime_user -p azantime

# Check prayer engine manually
docker compose exec backend node test-prayer.js

# Check trigger for a real user
docker compose exec backend node test-trigger.js

# Watch scheduler output
docker compose logs -f backend | grep -E "🕌|✅|❌|⏰"

# Pull latest code and redeploy
git pull origin main
docker compose up -d --build
```

---

## MySQL Commands

```bash
# Enter MySQL CLI
docker compose exec mysql mysql -u azantime_user -p azantime

# Inside MySQL:
SELECT COUNT(*) FROM cities;     -- should be 20
SELECT COUNT(*) FROM users;      -- your users
SELECT * FROM trigger_log ORDER BY triggered_at DESC LIMIT 10;
```

---

## GitHub Actions Auto-Deploy (optional)

1. In your GitHub repo → Settings → Secrets → Actions, add:
   - `VPS_HOST` = your server IP
   - `VPS_SSH_KEY` = your deploy user's private SSH key

2. Every push to `main` will auto-deploy.

---

## Alexa Skill Setup Checklist

After the server is running:

### Smart Home Skill
1. Go to https://developer.amazon.com/alexa/console/ask
2. Create Skill → **Smart Home**
3. Endpoint: `https://azantime.de/alexa/smart-home`
4. Account Linking → same LWA credentials
5. Copy Skill ID → add to `backend/.env` as `ALEXA_SMART_HOME_SKILL_ID`
6. Redeploy: `docker compose up -d --build`

### Custom Skill
1. Create Skill → **Custom** → Provision your own
2. Invocation name: `azan time`
3. Endpoint HTTPS: `https://azantime.de/alexa/custom`
4. Enable **AudioPlayer** in Interfaces tab
5. Account Linking → same LWA credentials
6. Copy Skill ID → add to `.env` as `ALEXA_SKILL_ID`
7. Redeploy

### Audio Files (Cloudflare R2)
1. Create R2 bucket: `azantime-audio`
2. Upload: `fajr.mp3`, `dhuhr.mp3`, `asr.mp3`, `maghrib.mp3`, `isha.mp3`
3. Add custom domain: `cdn.azantime.de`
4. Enable public access + CORS (AllowedOrigins: ["*"], Methods: GET, HEAD)

---

## Troubleshooting

**Backend not starting?**
```bash
docker compose logs backend
# Check for missing env vars — server exits on startup if any are missing
```

**MySQL connection failed?**
```bash
# Check MySQL is healthy
docker compose ps
# Wait 15-20s for MySQL to fully start on first boot
```

**Alexa skill not triggering?**
```bash
# Check trigger log
docker compose exec mysql mysql -u azantime_user -p azantime \
  -e "SELECT * FROM trigger_log ORDER BY triggered_at DESC LIMIT 5;"
# Check user has device_id set (needs to discover device via Alexa first)
docker compose exec mysql mysql -u azantime_user -p azantime \
  -e "SELECT id, city_id, device_id, is_active FROM users;"
```
