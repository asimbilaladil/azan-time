# Saut Al Adhan — Alexa Adhan Automation

Automatically plays the Adhan on Amazon Echo devices at all 5 daily prayer times, based on real mosque schedules from [my-masjid.com](https://my-masjid.com).

Live at: **sautaladhan.com**

---

## How It Works

```
User visits sautaladhan.com
  → Connects Amazon account (Login With Amazon OAuth)
  → Selects their mosque from my-masjid.com
        ↓
Backend scheduler runs every minute
        ↓
At prayer time → sends DoorbellPress event to Alexa Smart Home API
        ↓
Alexa Routine fires → plays Adhan via Custom Skill (AudioPlayer)
        ↓
Adhan MP3 streams on Echo device automatically
```

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js 20 · Express · MySQL 8 · node-cron |
| Frontend | Next.js 14 · Tailwind CSS |
| Prayer times | my-masjid.com API (real mosque schedules, full year cached) |
| Auth | Login With Amazon (LWA OAuth2) + JWT |
| Infrastructure | Hetzner VPS · Nginx · Docker Compose |
| Audio CDN | Cloudflare R2 → `cdn.sautaladhan.com` |

---

## Project Structure

```
azan-time/
├── backend/
│   ├── server.js                    # Express entry point
│   ├── scheduler.js                 # Runs every minute, triggers at prayer time
│   ├── services/
│   │   ├── alexaDirectService.js    # Direct Echo control via alexa-remote2 (primary)
│   │   ├── alexaTrigger.js          # DoorbellPress Smart Home trigger (fallback)
│   │   ├── masjidService.js         # my-masjid.com API + daily DB cache
│   │   ├── authService.js           # LWA OAuth2 + JWT
│   │   ├── prayerService.js         # Prayer time calculations
│   │   └── encryption.js            # AES-256-GCM token encryption
│   ├── routes/
│   │   ├── auth.js                  # /api/auth/lwa, /api/auth/callback
│   │   ├── user.js                  # /api/user/me, /api/user/settings, /api/user/alexa-status
│   │   ├── mosques.js               # /api/mosques/search, /:guid/times
│   │   ├── alexaSmartHome.js        # /alexa/smart-home (Smart Home skill)
│   │   ├── alexaCustom.js           # /alexa/custom (AudioPlayer skill)
│   │   └── alexaDirect.js           # /api/alexa-direct (direct device commands)
│   ├── middleware/auth.js            # JWT verification
│   └── database/
│       ├── mysql.js                 # Connection pool
│       └── migrations/
│           ├── 001_init.sql         # users, cities, trigger_log
│           ├── 002_mosques.sql      # mosque cache table
│           ├── 003_add_event_token_to_users.sql
│           └── 004_add_alexa_device_serial.sql
├── frontend/nextjs-app/
│   └── app/
│       ├── page.tsx                 # Landing page
│       ├── connect/page.tsx         # Amazon OAuth connect
│       ├── dashboard/page.tsx       # Prayer times + mosque selector
│       ├── alexa-setup/page.tsx     # Skill setup guide
│       ├── privacy/page.tsx
│       └── terms/page.tsx
├── nginx/sautaladhan.conf           # Nginx reverse proxy config
├── docker-compose.yml
├── DEPLOY.md                        # Full deployment guide
└── SKILLS.md                        # Alexa skill setup guide
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | Health check |
| GET | `/api/auth/lwa` | — | Redirect to Amazon login |
| GET | `/api/auth/callback` | — | OAuth callback → issues JWT |
| POST | `/api/auth/refresh` | JWT | Refresh LWA access token |
| GET | `/api/user/me` | JWT | Current user profile |
| PUT | `/api/user/settings` | JWT | Save mosque selection |
| GET | `/api/user/alexa-status` | JWT | Check if Alexa token is valid |
| GET | `/api/mosques/search?q=` | — | Search mosques |
| GET | `/api/mosques/:guid/times` | JWT | Today's prayer times |
| POST | `/alexa/smart-home` | Alexa | Smart Home skill endpoint |
| POST | `/alexa/custom` | Alexa | Custom AudioPlayer skill endpoint |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
PORT=3000
NODE_ENV=production

# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=sautaladhan
DB_USER=sautaladhan_user
DB_PASSWORD=<strong password>
DB_ROOT_PASSWORD=<strong root password>

# Login With Amazon
LWA_CLIENT_ID=<from Amazon Developer Console>
LWA_CLIENT_SECRET=<from Amazon Developer Console>
LWA_REDIRECT_URI=https://sautaladhan.com/api/auth/callback

# Alexa Skills
ALEXA_SKILL_ID=<custom skill ID>
ALEXA_SMART_HOME_SKILL_ID=<smart home skill ID>
ALEXA_EVENT_CLIENT_ID=<smart home skill LWA client ID>
ALEXA_EVENT_CLIENT_SECRET=<smart home skill LWA client secret>

# Security
# Generate JWT_SECRET with: openssl rand -base64 48
JWT_SECRET=<min 32 chars>

# Generate ENCRYPTION_KEY with: openssl rand -hex 32
ENCRYPTION_KEY=<exactly 64 hex chars>

# Cloudflare R2 or any public CDN hosting the MP3 files
CDN_BASE_URL=https://cdn.sautaladhan.com
```

---

## Deployment

### Prerequisites

- Ubuntu 24.04 VPS (Hetzner CX22 or similar)
- Domain `sautaladhan.com` pointing to the server IP
- Docker + Docker Compose installed

```bash
curl -fsSL https://get.docker.com | sudo bash
sudo apt install -y docker-compose-plugin nginx certbot python3-certbot-nginx
```

### Steps

```bash
# 1. Clone
git clone https://github.com/<your-username>/azan-time.git /var/www/azan-time
cd /var/www/azan-time

# 2. Configure environment
cp backend/.env.example backend/.env
nano backend/.env                        # fill in all values

cp frontend/nextjs-app/.env.local.example frontend/nextjs-app/.env.local
# .env.local only needs: NEXT_PUBLIC_API_URL=https://sautaladhan.com/api

# 3. SSL + Nginx
sudo cp nginx/sautaladhan.conf /etc/nginx/sites-available/sautaladhan
sudo ln -sf /etc/nginx/sites-available/sautaladhan /etc/nginx/sites-enabled/
sudo certbot --nginx -d sautaladhan.com -d www.sautaladhan.com
sudo systemctl reload nginx

# 4. Start
docker compose up -d --build

# 5. Verify
curl https://sautaladhan.com/health
# Expected: {"status":"ok","ts":"..."}
```

### Redeploy after code changes

```bash
git pull
docker compose up -d --build
```

---

## Alexa Setup

Two Alexa skills are required. Full step-by-step in [SKILLS.md](./SKILLS.md).

### Smart Home Skill
- Name: `Azan Time`
- Endpoint: `https://sautaladhan.com/alexa/smart-home`
- Exposes a virtual "Azan" doorbell device
- The backend sends a DoorbellPress event at prayer time → triggers your Routine

### Custom AudioPlayer Skill
- Name: `Azan Time`
- Endpoint: `https://sautaladhan.com/alexa/custom`
- Invocation: `open azan time`
- Streams the Adhan MP3 from the CDN

### Alexa Routine (one-time setup in Alexa app)
1. Alexa app → More → Routines → `+`
2. **When:** Smart Home → Azan → Turned ON
3. **Action:** Skills → Azan Time
4. Select your Echo device → Save

### Verify Alexa token health

After enabling the skill, check:
```bash
curl -H "Authorization: Bearer <your-jwt>" https://sautaladhan.com/api/user/alexa-status
# Expected: { "linked": true, "tokenValid": true, "minutesLeft": 55 }
```

If `linked` is `false`, re-enable the Alexa skill in the Alexa app (Settings → Skills → Your Skills).

---

## Audio Files (CDN)

Upload to your CDN bucket (`cdn.sautaladhan.com`):

| File | Prayer |
|------|--------|
| `fajr.mp3` | Fajr (use version with "As-salatu khayrun min an-nawm") |
| `dhuhr.mp3` | Dhuhr |
| `asr.mp3` | Asr |
| `maghrib.mp3` | Maghrib |
| `isha.mp3` | Isha |

Test: `curl -I https://cdn.sautaladhan.com/fajr.mp3` → should return 200.

---

## Token Refresh

Alexa Smart Home tokens expire every ~1 hour. The scheduler keeps them alive automatically:

- Every 55 min — proactively refreshes all active user tokens
- Every 5 min — pre-warms tokens for users with a prayer in ~30 minutes
- On trigger — refreshes on the fly if token is within 5 min of expiry

If the token gets revoked (user disabled the skill), it is cleared from the database and `GET /api/user/alexa-status` returns `linked: false`. The user re-enables the skill in the Alexa app to restore it.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend won't start | `docker compose logs backend` — missing env vars cause immediate exit |
| `lwa-invalid-parameter-bad-redirect-uri` | `LWA_REDIRECT_URI` in `.env` must exactly match the Allowed Return URL in the Amazon Security Profile |
| Azan stops after a few hours | `GET /api/user/alexa-status` — if `linked: false`, re-enable the Alexa skill in the Alexa app |
| Alexa device not discovered | Complete account linking in Alexa app, then ask Alexa to discover devices |
| Adhan not playing | Check Routine triggers on "Azan" switch turned ON; confirm AudioPlayer interface is enabled on custom skill |
| Wrong prayer times | Check `mosque_guid` is set: `docker compose exec mysql mysql -u sautaladhan_user -p sautaladhan -e "SELECT id, mosque_guid FROM users;"` |
| MySQL not ready on first boot | Wait 20–30s for MySQL to fully initialize |

```bash
# View live trigger log
docker compose exec mysql mysql -u sautaladhan_user -p sautaladhan \
  -e "SELECT * FROM trigger_log ORDER BY triggered_at DESC LIMIT 10;"

# Watch scheduler output
docker compose logs -f backend | grep -E "🕌|✅|❌|🔄"
```
