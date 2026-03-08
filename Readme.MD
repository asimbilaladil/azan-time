# 🕌 Saut Al Adhan — Alexa Azan Automation System

> Automatically plays the Adhan (Islamic call to prayer) on Amazon Alexa devices at the correct prayer times — 5x daily — based on the user's city or mosque.

---

## What It Does

A Muslim user enables this Alexa skill once. After a simple 4-step setup, the Adhan plays automatically every day at Fajr, Zuhr, Asr, Maghrib, and Isha — with zero daily interaction required.

**Stack:** Node.js · Express · MySQL · adhan-js · Next.js · Tailwind · Alexa Skills Kit  
**Hosting:** Hetzner CAX11 VPS (~€5/month, scales to 100,000+ users)

---

## How It Works

```
User enables skill
  ↓
Links Amazon account (LWA OAuth)
  ↓
Selects city/mosque on website
  ↓
Creates 1 Alexa routine: WHEN "Azan pressed" → Open Saut Al Adhan
  ↓
Backend scheduler runs every minute
  ↓
At prayer time → triggers virtual "Azan" device via Smart Home API
  ↓
Alexa routine fires → Custom Skill streams correct Adhan MP3
  ↓
🔊 Adhan plays automatically
```

---

## User Setup (4 Steps)

1. `Alexa, enable Saut Al Adhan`
2. Link Amazon account at `https://azantime.de/connect`
3. Select your city / mosque / calculation method
4. Create one Alexa routine: **WHEN** `Azan is pressed` → **ACTION** `Open Saut Al Adhan`

That's it. Adhan plays automatically every day.

---

## Project Structure

```
saut-al-adhan/
├── /backend
│   ├── server.js              # Express entry point
│   ├── scheduler.js           # node-cron prayer trigger loop
│   ├── prayerService.js       # adhan-js prayer time calculation
│   ├── alexaSmartHome.js      # Smart Home Skill handler + device trigger
│   ├── alexaCustomSkill.js    # Custom Skill handler + audio streaming
│   ├── authService.js         # LWA OAuth2 flow
│   └── userService.js         # User CRUD
├── /database
│   ├── mysql.js               # Connection pool
│   └── migrations/            # SQL schema files
├── /frontend
│   └── nextjs-app/            # Next.js 14 + Tailwind CSS
├── /audio
│   ├── fajr.mp3
│   ├── zuhr.mp3
│   ├── asr.mp3
│   ├── maghrib.mp3
│   └── isha.mp3
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

---

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=azantime
DB_USER=root
DB_PASSWORD=your_password

# Login With Amazon (LWA)
LWA_CLIENT_ID=your_lwa_client_id
LWA_CLIENT_SECRET=your_lwa_client_secret
LWA_REDIRECT_URI=https://azantime.de/auth/callback

# Alexa
ALEXA_SKILL_ID=your_skill_id
ALEXA_SMART_HOME_SKILL_ID=your_smart_home_skill_id

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars

# CDN
CDN_BASE_URL=https://cdn.azantime.de

# Encryption (for LWA tokens at rest)
ENCRYPTION_KEY=your_32_byte_encryption_key
```

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO | |
| amazon_user_id | VARCHAR(255) UNIQUE | From LWA |
| city_id | INT FK | → cities table |
| latitude | DECIMAL(10,7) | Mosque override |
| longitude | DECIMAL(10,7) | Mosque override |
| timezone | VARCHAR(64) | e.g. Europe/Berlin |
| calculation_method | VARCHAR(64) | MuslimWorldLeague etc. |
| device_id | VARCHAR(255) | Alexa endpointId |
| access_token | TEXT | Encrypted |
| refresh_token | TEXT | Encrypted |
| created_at | TIMESTAMP | |

### `cities`
| Column | Type | Notes |
|---|---|---|
| id | INT PK AUTO | |
| name | VARCHAR(128) | e.g. Berlin |
| country | VARCHAR(64) | e.g. DE |
| latitude | DECIMAL(10,7) | |
| longitude | DECIMAL(10,7) | |
| timezone | VARCHAR(64) | |
| calculation_method | VARCHAR(64) | Default for region |

> **Scaling insight:** Prayer times are calculated once per city, not per user. 200 cities with 100,000 users = 200 calculations/minute instead of 100,000.

---

## Monthly Cost

| Component | Cost |
|---|---|
| Hetzner CAX11 VPS | €3.79 |
| Domain | €1.00 |
| Cloudflare R2 CDN | €1.00 |
| **Total** | **~€5/month** |

Handles **100,000+ users** with no infrastructure changes.

---

## Implementation Tasks

All atomic AI-executable tasks are in [`/tasks`](./tasks/):

| File | Description |
|---|---|
| [T01-vps-setup.md](./tasks/T01-vps-setup.md) | Hetzner VPS + Nginx + SSL |
| [T02-database.md](./tasks/T02-database.md) | MySQL schema + migrations |
| [T03-express-boilerplate.md](./tasks/T03-express-boilerplate.md) | Express server + folder structure |
| [T04-lwa-oauth.md](./tasks/T04-lwa-oauth.md) | Login With Amazon OAuth2 flow |
| [T05-prayer-engine.md](./tasks/T05-prayer-engine.md) | adhan-js prayer time calculation |
| [T06-scheduler.md](./tasks/T06-scheduler.md) | node-cron scheduler loop |
| [T07-smart-home-skill.md](./tasks/T07-smart-home-skill.md) | Alexa Smart Home Skill |
| [T08-custom-skill.md](./tasks/T08-custom-skill.md) | Alexa Custom Skill + AudioPlayer |
| [T09-device-trigger.md](./tasks/T09-device-trigger.md) | Backend → Alexa device trigger |
| [T10-frontend-connect.md](./tasks/T10-frontend-connect.md) | Next.js connect + city selection page |
| [T11-frontend-dashboard.md](./tasks/T11-frontend-dashboard.md) | User settings dashboard |
| [T12-audio-cdn.md](./tasks/T12-audio-cdn.md) | Cloudflare R2 audio hosting |
| [T13-docker-deploy.md](./tasks/T13-docker-deploy.md) | Docker + docker-compose + PM2 |
| [T14-security.md](./tasks/T14-security.md) | JWT, rate limiting, helmet, CORS |
| [T15-testing.md](./tasks/T15-testing.md) | End-to-end test checklist |

---

## Future Improvements

- Mosque-specific Adhan streams
- Multiple Adhan voices / reciters
- Ramadan-specific notifications (Suhoor / Iftar)
- Prayer time announcements (5-min warning)
- Multi-language support (Arabic, Urdu, Turkish)
- Google Home integration
- iOS/Android companion app

---

## License

MIT
