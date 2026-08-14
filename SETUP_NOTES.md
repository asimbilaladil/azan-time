# Deployment Setup Notes — sautaladhan.com

Notes on the VPS setup done for this repo (branch `migrate-to-sautaladhan`), so future changes don't fight past decisions.

## Pre-existing on this VPS (not installed by this setup)

This is a shared VPS already running other sites (adelwebhandels, techstepsolutions, speakdeutsch, omnivoice) plus `ntopng` and a WireGuard VPN. That's why some non-default choices were made below.

- nginx (with existing vhosts in `/etc/nginx/sites-available/`)
- certbot 2.9.0 (already issuing certs for other domains)
- MySQL 8.0.46 (`mysql.service`, root access via `sudo`/local socket)
- Node.js v20.20.2 / npm 10.8.2
- ufw firewall, already active with `22`, `80`, `443`, `3000/tcp`, `5600/tcp`, `51820/udp` open

## Ports

| Port | Used by | Exposed externally? |
|------|---------|----------------------|
| 80 | nginx (redirects to 443) | Yes (ufw pre-existing) |
| 443 | nginx (TLS termination) | Yes (ufw pre-existing) |
| 3000 | **ntopng** (unrelated, pre-existing) | Yes (ufw pre-existing) — **not** this app |
| 3001 | backend's internal Alexa-Remote login proxy (`alexa-remote2`) | No — localhost only |
| **3010** | backend API (Node/Express) — moved off default 3000 because that port was already taken by ntopng | No — proxied via nginx only |
| **3011** | frontend (Next.js dev server) — moved off default 3001 because that port is used internally by the backend's Alexa proxy | No — proxied via nginx only |
| 3306 | MySQL | No — localhost only |

**No new firewall rules were added.** 80/443 were already open in ufw from the existing nginx setup, and the app's own ports (3010/3011/3306) are only bound to localhost / reached through the nginx reverse proxy, so they were deliberately left closed.

## What was installed / configured

1. **Cloned the repo**: `git clone -b migrate-to-sautaladhan https://github.com/asimbilaladil/azan-time.git` into `/opt/azan-time`.

2. **MySQL**
   - Created database `azantime` (name is hardcoded in the migration files' `CREATE DATABASE`/`USE` statements — the `.env.example` default of `sautaladhan` was not used, to match the migrations as-is).
   - Created user `sautaladhan_user`@`localhost`, granted all privileges on `azantime.*`.
   - Ran migrations `001_init.sql` → `004_add_alexa_device_serial.sql` from `backend/database/migrations/`.

3. **Backend** (`backend/`)
   - `npm install`.
   - Pinned `adhan` to `4.4.3` (exact version, `--save-exact`) — `4.4.4` ships a broken `package.json` (`"type": "module"` but `main` points at a CJS file), which crashes on `require()` under Node 20.
   - Installed `alexa-remote2` — it's `require()`d in `services/alexaDirectService.js` but was missing from `package.json` entirely.
   - Created `backend/.env` (not committed) from `.env.example` with:
     - `PORT=3010`
     - `DB_HOST=localhost`, `DB_NAME=azantime`, `DB_USER=sautaladhan_user`, generated `DB_PASSWORD`
     - Generated `JWT_SECRET` and `ENCRYPTION_KEY` (`openssl rand -hex 32`)
     - `LWA_REDIRECT_URI=https://sautaladhan.com/api/auth/callback`
     - Real `LWA_CLIENT_ID` / `LWA_CLIENT_SECRET` (provided by user, from the Amazon Login security profile)
   - Run with `node server.js` (currently via `nohup`, **not** a process manager — see Known Gaps below).

4. **Frontend** (`frontend/nextjs-app/`)
   - `npm install`.
   - Created `.env.local` with `NEXT_PUBLIC_API_URL=https://sautaladhan.com/api`.
   - Run in dev mode: `next dev -p 3011` (currently via `nohup` — see Known Gaps).
   - **Bug fix**: `app/page.tsx` had a large inline `<style>{`...`}</style>` block causing a React hydration "Text content did not match" error. Moved that CSS into `app/globals.css` (static, not part of the React render tree) and removed the inline `<style>` tag. No visual/behavioral change, just eliminates the hydration mismatch.

5. **nginx**
   - New vhost: `/etc/nginx/sites-available/sautaladhan.com`, symlinked into `sites-enabled/`.
   - Proxies:
     - `/` → `localhost:3011` (frontend)
     - `/api/`, `/health`, `/alexa/smart-home`, `/alexa/custom` → `localhost:3010` (backend)

6. **SSL**
   - `certbot --nginx -d sautaladhan.com -d www.sautaladhan.com` — issued and auto-installed a Let's Encrypt cert.
   - Certbot rewrote the vhost to add the `443 ssl` block and a `80 → 404` block with host-based redirects to HTTPS (certbot's standard managed pattern).
   - Cert auto-renews via certbot's systemd timer (already active on this host for the other domains).
   - Expires 2026-11-12.

## Known gaps / suggested next steps

- **No process manager.** Both backend and frontend are running via `nohup` in a background shell. They will **not** survive a reboot or crash. The repo ships `backend/ecosystem.config.js` for PM2 — recommend switching to PM2 (or systemd units) for both processes.
- **Frontend is in dev mode** (`next dev`), not a production build. `NODE_ENV` is `development`. Recommend `npm run build && npm start` in production.
- **Alexa Remote (direct-control) login not done** — `alexaDirectService.js` needs an interactive Amazon login via the local proxy on port 3001 (tunneled over SSH) to get a session cookie. Not required for the Smart Home / Custom Skill flows, only for the "direct device control" fallback path.
- `ALEXA_SKILL_ID` / `ALEXA_SMART_HOME_SKILL_ID` env vars are still blank — needed once the Alexa skills are created in the developer console.
