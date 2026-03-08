# 🕌 Azan Time — Alexa Azan Automation System

> Automatically plays the Adhan (Islamic call to prayer) on Amazon Alexa devices at the correct prayer times — 5x daily — based on the user's city.

## How It Works

```
User enables skill → Links Amazon account (LWA OAuth) → Selects city
  ↓
Backend scheduler runs every minute
  ↓
At prayer time → triggers virtual "Azan" device via Smart Home API
  ↓
Alexa routine fires → Custom Skill streams correct Adhan MP3
  ↓
🔊 Adhan plays automatically
```

## Stack
**Backend:** Node.js 20 · Express · MySQL 8 · adhan-js · node-cron  
**Frontend:** Next.js 14 · Tailwind CSS  
**Infrastructure:** Docker · Nginx · Hetzner CAX11 (~€5/month)

## Quick Deploy

```bash
git clone https://github.com/YOUR_USERNAME/azan-time.git /var/www/azantime
cd /var/www/azantime
cp backend/.env.example backend/.env
# Fill in .env, then:
docker compose up -d --build
```

See **[DEPLOY.md](./DEPLOY.md)** for the complete step-by-step guide.

## Project Structure

```
azan-time/
├── backend/
│   ├── server.js                    # Express entry point
│   ├── scheduler.js                 # node-cron prayer trigger loop
│   ├── services/
│   │   ├── prayerService.js         # adhan-js prayer time calculation
│   │   ├── authService.js           # LWA OAuth2 + JWT
│   │   ├── alexaTrigger.js          # Alexa Event Gateway trigger
│   │   └── encryption.js            # AES-256-GCM token encryption
│   ├── routes/
│   │   ├── auth.js                  # /api/auth/* (LWA OAuth)
│   │   ├── user.js                  # /api/user/* (settings)
│   │   ├── cities.js                # /api/cities
│   │   ├── alexaSmartHome.js        # /alexa/smart-home
│   │   └── alexaCustom.js           # /alexa/custom (AudioPlayer)
│   ├── middleware/auth.js            # JWT middleware
│   ├── database/
│   │   ├── mysql.js                 # Connection pool
│   │   └── migrations/001_init.sql  # Schema + 20 seed cities
│   └── ecosystem.config.js          # PM2 config
├── frontend/nextjs-app/
│   └── app/
│       ├── page.tsx                 # Landing page
│       ├── connect/page.tsx         # Amazon account linking + city setup
│       ├── setup/page.tsx           # Alexa routine guide
│       └── dashboard/page.tsx       # User settings
├── nginx/azantime.conf              # Nginx reverse proxy config
├── docker-compose.yml
├── DEPLOY.md                        # Complete deployment guide
└── .github/workflows/deploy.yml     # Auto-deploy on git push
```

## License
MIT
