# 🕌 Azan Time — Alexa Adhan Automation

Automatically plays the Adhan on Amazon Alexa devices at all 5 daily prayer times, based on real mosque prayer schedules from my-masjid.com.

---

## How It Works

```
User visits azantime.de → Connects Amazon account (LWA OAuth) → Selects mosque
  ↓
Backend scheduler runs every minute
  ↓
At prayer time → turns ON virtual "Azan" switch (Alexa Smart Home API)
  ↓
Alexa Routine fires → plays "Saut Al Adhan" Custom Skill
  ↓
🔊 Adhan MP3 streams on Alexa device automatically
```

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js 20 · Express · MySQL 8 · node-cron |
| Frontend | Next.js 14 · Tailwind CSS · Cormorant Garamond + DM Sans |
| Prayer times | my-masjid.com API (real mosque schedules, full year cached) |
| Auth | Login With Amazon (LWA OAuth2) + JWT |
| Infrastructure | Hetzner CAX11 VPS · Nginx · PM2 |
| Audio CDN | Cloudflare R2 → cdn.azantime.de |

---

## Infrastructure

- **VPS:** Hetzner CAX11 — `89.167.65.137`
- **Domain:** `azantime.de` (+ `cdn.azantime.de` for audio)
- **Backend:** PM2 cluster (2 instances) on port 3000
- **Frontend:** PM2 fork on port 3001
- **Nginx:** Reverse proxy at `/etc/nginx/sites-enabled/azantime`

---

## Project Structure

```
azan-time/
├── backend/
│   ├── server.js                        # Express entry point
│   ├── scheduler.js                     # Runs every minute, triggers Alexa at prayer time
│   ├── ecosystem.config.js              # PM2 config (2 cluster + logs to /var/log/azantime/)
│   ├── services/
│   │   ├── masjidService.js             # my-masjid.com API + daily DB cache
│   │   ├── authService.js               # LWA OAuth2 + JWT issuance
│   │   ├── alexaTrigger.js              # Alexa Event Gateway trigger
│   │   └── encryption.js               # AES-256-GCM token encryption
│   ├── routes/
│   │   ├── auth.js                      # /api/auth/lwa + /api/auth/callback
│   │   ├── user.js                      # /api/user/me + /api/user/settings
│   │   ├── mosques.js                   # /api/mosques/search + /:guid/times
│   │   ├── alexaSmartHome.js            # /alexa/smart-home (virtual switch)
│   │   └── alexaCustom.js              # /alexa/custom (AudioPlayer)
│   ├── middleware/auth.js               # JWT verification middleware
│   └── database/
│       ├── mysql.js                     # Connection pool
│       └── migrations/
│           ├── 001_init.sql             # Initial schema
│           └── 002_mosques.sql          # Mosque cache table + mosque_guid on users
├── frontend/nextjs-app/
│   └── app/
│       ├── layout.tsx                   # Google Fonts (Cormorant Garamond + DM Sans)
│       ├── globals.css                  # CSS variables, animations, Islamic geometric pattern
│       ├── page.tsx                     # Landing page (emerald + gold design)
│       ├── connect/page.tsx             # Amazon OAuth connect page
│       └── dashboard/page.tsx           # Live clock + prayer times + mosque selector
├── nginx/azantime.conf
├── DEPLOY.md
├── SKILLS.md                            # Alexa skill setup guide
└── .github/workflows/deploy.yml
```

---

## Database Schema

```sql
users
  id, amazon_user_id, email
  mosque_guid VARCHAR(36)               ← selected mosque (links to mosques table)
  device_id                             ← Alexa device (set via Smart Home skill)
  access_token, refresh_token,
  token_expires_at                      ← AES-256-GCM encrypted LWA tokens
  is_active, created_at, updated_at

mosques                                 ← daily cache of my-masjid.com data
  guid VARCHAR(36) PRIMARY KEY
  name, city, country, timezone
  fajr, dhuhr, asr, maghrib, isha       ← "HH:MM" format
  times_date DATE                       ← cache key, refreshed daily
  created_at, updated_at
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/auth/lwa` | — | Redirect to Amazon login |
| GET | `/api/auth/callback` | — | Amazon OAuth callback → issues JWT |
| GET | `/api/user/me` | JWT | Get current user + mosque_guid |
| PUT | `/api/user/settings` | JWT | Save mosque_guid |
| GET | `/api/mosques/search?q=` | — | Search mosques via my-masjid.com |
| GET | `/api/mosques/:guid/times` | JWT | Get today's prayer times for mosque |
| POST | `/alexa/smart-home` | Alexa | Smart Home skill endpoint |
| GET | `/alexa/custom` | Alexa | Custom AudioPlayer skill endpoint |
| GET | `/privacy` | — | Privacy policy page |
| GET | `/terms` | — | Terms page |

---

## Environment Variables (backend/.env)

```env
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=azantime
DB_USER=azantime_user
DB_PASSWORD=azantime_root

# Login With Amazon — Security Profile: "Azan Time - Security Profile"
# Profile ID: amzn1.application.10f1fc03caaa479d98a9c1c75918a579
LWA_CLIENT_ID=amzn1.application-oa2-client.6c00c2d528c74c0281bbbc2f06bb2b78
LWA_CLIENT_SECRET=YOUR_SECRET
LWA_REDIRECT_URI=https://azantime.de/api/auth/callback    ← must match Amazon exactly

# Alexa Skill IDs — fill after creating skills
ALEXA_SKILL_ID=                         ← Custom "Saut Al Adhan" skill (pending)
ALEXA_SMART_HOME_SKILL_ID=              ← Smart Home "Azan Time" skill (pending)

# Security
JWT_SECRET=+hPmqFrjvxNOWse5cddjqlUsXlfA0HX5714YNKDp1CaeX4XtRPeptgh2KMqCU4Lb
ENCRYPTION_KEY=478b09a62a3e42bd8bee03367cd0b28ec9bde5dd6f1409383cb2531214d50282

# Audio CDN
CDN_BASE_URL=https://cdn.azantime.de
```

---

## Amazon Security Profile

- **Profile Name:** Azan Time - Security Profile
- **Profile ID:** `amzn1.application.10f1fc03caaa479d98a9c1c75918a579`
- **Client ID:** `amzn1.application-oa2-client.6c00c2d528c74c0281bbbc2f06bb2b78`
- **Allowed Origins:** `https://azantime.de`
- **Allowed Return URLs:** `https://azantime.de/api/auth/callback`

---

## my-masjid.com API Notes

The API returns the **full year** of prayer times in one call — cached in DB daily.

```
GET https://time.my-masjid.com/api/TimingsInfoScreen/GetMasjidMultipleTimings?GuidId=<guid>
```

Key parsing facts:
- Results are under `r.data.model.salahTimings[]`
- Match today with `entry.day === new Date().getDate() && entry.month === new Date().getMonth() + 1`
- Each prayer is an **array**: use `fajr[0].salahTime`
- Dhuhr is called **`zuhr`** in the API (not `dhuhr`)
- Search results are under `r.data.model.masjidList[]`
- Search fields: `guidId`, `name`, `cityId`, `countryId`

---

## Deployment

```bash
# Standard deploy after git push
cd /var/www/azan-time
git pull
pm2 restart azantime-backend

# Frontend rebuild (only needed for frontend changes)
cd frontend/nextjs-app
npm run build
pm2 restart azan-time-frontend
```

PM2 processes:
```
id 0 | azantime-backend   | cluster | online
id 1 | azantime-backend   | cluster | online
id 2 | azan-time-frontend | fork    | online
```

Logs: `/var/log/azantime/`

---

## ✅ What Is Complete

- [x] VPS deployed, Nginx running, PM2 all online
- [x] MySQL schema — `users` + `mosques` tables with migrations
- [x] LWA OAuth2 login flow fully working (`/api/auth/lwa` → Amazon → `/api/auth/callback` → JWT)
- [x] Amazon Security Profile configured with correct redirect URI
- [x] Mosque search API (`/api/mosques/search?q=`) — working
- [x] Prayer times API (`/api/mosques/:guid/times`) — working with daily DB cache
- [x] my-masjid.com API parsing fixed (correct field names + array access)
- [x] Scheduler running every minute — matches `HH:MM` to prayer times
- [x] Alexa Smart Home route (`/alexa/smart-home`)
- [x] Alexa Custom AudioPlayer route (`/alexa/custom`)
- [x] Beautiful frontend — emerald + gold Islamic design
- [x] Landing page with animated prayer time preview
- [x] Connect page — Amazon OAuth flow
- [x] Dashboard — live clock, mosque card, all 5 prayer times, active prayer highlighted
- [x] Mosque search + selection working in dashboard
- [x] End-to-end tested: login → select Pak Moschee Berlin → prayer times displayed ✅

---

## ❌ What Is Left

### 1. Fix HTTPS (Not Secure warning)
The site loads over HTTP — Nginx SSL needs to be configured.

```bash
# Check current Nginx config
cat /etc/nginx/sites-enabled/azantime

# If SSL not configured, use certbot
certbot --nginx -d azantime.de -d www.azantime.de
```

---

### 2. Smart Home Skill ("Azan Time")

Creates a virtual "Azan" switch — backend turns it ON at prayer time.

1. Go to [developer.amazon.com/alexa/console/ask](https://developer.amazon.com/alexa/console/ask) → **Create Skill**
2. Name: `Azan Time` · Model: **Smart Home** · Hosting: **Provision your own**
3. Endpoint: `https://azantime.de/alexa/smart-home`
4. Account Linking:
   - Authorization URI: `https://www.amazon.com/ap/oa`
   - Access Token URI: `https://api.amazon.com/auth/o2/token`
   - Client ID: `amzn1.application-oa2-client.6c00c2d528c74c0281bbbc2f06bb2b78`
   - Client Secret: from `.env`
   - Scope: `profile:user_id`
5. Copy **Skill ID** → add to `.env`:
   ```
   ALEXA_SMART_HOME_SKILL_ID=amzn1.ask.skill.XXXX
   ```
6. `pm2 restart azantime-backend`
7. Alexa app → Enable "Azan Time" → Discover devices → **"Azan" switch appears** ✅

---

### 3. Custom Skill ("Saut Al Adhan")

Streams the Adhan MP3 when triggered by the Routine.

1. **Create Skill** → Name: `Saut Al Adhan` · Model: **Custom** · Start from scratch
2. Invocation name: `saut al adhan`
3. **Interfaces** → enable **Audio Player** ← critical, don't skip
4. Endpoint → HTTPS → `https://azantime.de/alexa/custom`
   - SSL: "My endpoint has a certificate from a trusted CA"
5. JSON Editor → replace with:
   ```json
   {
     "interactionModel": {
       "languageModel": {
         "invocationName": "saut al adhan",
         "intents": [
           { "name": "AMAZON.CancelIntent", "samples": [] },
           { "name": "AMAZON.StopIntent", "samples": [] },
           { "name": "AMAZON.PauseIntent", "samples": [] },
           { "name": "AMAZON.ResumeIntent", "samples": [] }
         ]
       }
     }
   }
   ```
6. **Save Model** → **Build Model** (~30 seconds)
7. Copy **Skill ID** → add to `.env`:
   ```
   ALEXA_SKILL_ID=amzn1.ask.skill.YYYY
   ```
8. `pm2 restart azantime-backend`
9. Test tab → type `open saut al adhan` → should see `AudioPlayer.Play` ✅

---

### 4. Upload Adhan MP3 Files to CDN

Upload to Cloudflare R2 bucket `azantime-audio` — must be accessible at `cdn.azantime.de`:

| File | Prayer | Note |
|------|--------|------|
| `fajr.mp3` | Fajr | Use Fajr Adhan with "As-salatu khayrun min an-nawm" |
| `dhuhr.mp3` | Dhuhr | Standard Adhan |
| `asr.mp3` | Asr | Standard Adhan |
| `maghrib.mp3` | Maghrib | Standard Adhan |
| `isha.mp3` | Isha | Standard Adhan |

Test: `curl -I https://cdn.azantime.de/fajr.mp3` should return 200.

---

### 5. Create Alexa Routine

Connects the Smart Home switch to the Custom skill audio.

1. Alexa app → More → **Routines** → `+`
2. **When:** Smart Home → Azan → Turned ON
3. **Action:** Skills → Saut Al Adhan
4. Select your Echo device → **Save**

---

### 6. End-to-End Test

```bash
# Manually verify scheduler fires at prayer time
pm2 logs azantime-backend --lines 50 | grep -i "prayer\|fajr\|dhuhr\|asr\|maghrib\|isha"

# Check trigger log in DB
mysql -u azantime_user -pazantime_root azantime -e "SELECT * FROM trigger_log ORDER BY created_at DESC LIMIT 10;"
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `lwa-invalid-parameter-bad-redirect-uri-vendor` | Allowed Return URL in Security Profile must match `LWA_REDIRECT_URI` in `.env` exactly |
| `lwa-invalid-parameter-bad-scope` | Change scope to `profile:user_id` in `authService.js` |
| `client_id is required` | `LWA_REDIRECT_URI` was set to wrong URL — must be `https://azantime.de/api/auth/callback` |
| `"Failed to search mosques"` | API returns `r.data.model.masjidList` — check parsing in `masjidService.js` |
| Backend errored in PM2 | Run `node server.js` directly to see crash line |
| `mosquesRouter is not defined` | Add `const mosquesRouter = require('./routes/mosques')` before line 88 in `server.js` |
| Not Secure (HTTP) | Run certbot or check Nginx SSL config |
| Alexa device not discovered | Verify Smart Home endpoint reachable + account linking complete |
| Adhan not playing | Check Routine trigger is Azan **switch** (not scene) + AudioPlayer interface enabled on skill |
| Prayer time wrong day | VPS timezone check: `timedatectl` — should be UTC or Europe/Berlin |
