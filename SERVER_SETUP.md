# Server Setup — sautaladhan.com

This is the step-by-step for standing up a **clean** server for this project.
Follow it in order — several steps exist specifically because of what went
wrong with the previous domain (azantime.de), and skipping them is how that
happens again.

---

## 0. Before you touch the server

Do these first, outside of any terminal:

- [ ] New VPS from a provider/account with **no history tied to the old
      `89.167.65.137` IP or account**. Do not reuse that box even if it's
      unlocked.
- [ ] Confirm `sautaladhan.com` DNS is in your **current** Cloudflare account
      (the dashboard link you have) and **not** still pointing at the old
      VPS IP anywhere (A record, AAAA, or old subdomains like `cdn.` /
      `www.`).
- [ ] New Amazon Developer **Security Profile** (LWA) — do not reuse the old
      Client ID/Secret. Set **Allowed Return URLs** to:
      `https://sautaladhan.com/api/auth/callback`
- [ ] New/updated Alexa **Smart Home Skill** manifest — account-linking
      redirect URL and HTTPS endpoint both point at `sautaladhan.com`, not
      the old domain.
- [ ] New Cloudflare R2 bucket `sautaladhan-audio`, with the 5 Adhan MP3s
      re-uploaded, and custom domain `cdn.sautaladhan.com` attached.
- [ ] Generate fresh secrets — do not copy these from the old `.env`:
      `JWT_SECRET` (32+ random chars), `ENCRYPTION_KEY` (`openssl rand -hex 32`),
      `DB_PASSWORD`, `DB_ROOT_PASSWORD`.

---

## 1. Base server hardening

```bash
# as root, first login
apt update && apt upgrade -y
adduser deploy
usermod -aG sudo deploy

# SSH key auth only
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys

# disable root + password SSH login
sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

## 2. Firewall — default deny, explicit allow only

This is the step that prevents a repeat of the abuse report. **The Alexa
login proxy port must never appear in this list.**

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP (redirects to HTTPS)
ufw allow 443/tcp     # HTTPS
ufw enable
ufw status verbose
```

Do **not** add a rule for port 3001, 3011, or whatever `ALEXA_PROXY_PORT`
ends up being. That port is only ever reached via SSH tunnel (step 8).

## 3. Install runtime dependencies

```bash
# Node.js (use whatever LTS the repo's package.json engines field specifies)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt install -y nodejs mysql-server nginx certbot python3-certbot-nginx git

npm install -g pm2
```

## 4. Clone and configure the app

```bash
sudo mkdir -p /var/www/sautaladhan
sudo chown deploy:deploy /var/www/sautaladhan
cd /var/www/sautaladhan
git clone https://github.com/asimbilaladil/azan-time.git .
git checkout migrate-to-sautaladhan   # or master, once this branch is merged
```

Backend env:
```bash
cd backend
cp .env.example .env
nano .env
```
Fill in the **fresh** secrets from step 0 — do not reuse old values. Set:
```
LWA_CLIENT_ID=<new security profile client id>
LWA_CLIENT_SECRET=<new security profile client secret>
LWA_REDIRECT_URI=https://sautaladhan.com/api/auth/callback
CDN_BASE_URL=https://cdn.sautaladhan.com
```

Frontend env:
```bash
cd ../frontend/nextjs-app
cp .env.local.example .env.local
nano .env.local
```

## 5. Database

```bash
sudo mysql_secure_installation
sudo mysql -e "CREATE DATABASE sautaladhan;"
sudo mysql -e "CREATE USER 'sautaladhan_user'@'localhost' IDENTIFIED BY '<DB_PASSWORD from .env>';"
sudo mysql -e "GRANT ALL PRIVILEGES ON sautaladhan.* TO 'sautaladhan_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"
mysql -u sautaladhan_user -p sautaladhan < backend/migrations/001_init.sql
```

## 6. Build and start the app

```bash
cd /var/www/sautaladhan/backend
npm ci --production
cd ../frontend/nextjs-app
npm ci && npm run build

cd /var/www/sautaladhan/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the printed instructions to enable on boot
```

## 7. Nginx + TLS

```bash
sudo cp /var/www/sautaladhan/nginx/sautaladhan.conf /etc/nginx/sites-available/sautaladhan
sudo ln -sf /etc/nginx/sites-available/sautaladhan /etc/nginx/sites-enabled/sautaladhan
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo certbot --nginx -d sautaladhan.com -d www.sautaladhan.com
```

Confirm `nginx -t` passes and the cert paths in
`nginx/sautaladhan.conf` match what certbot created.

## 8. One-time Alexa direct-service login (if using `alexaDirectService.js`)

**Read this before running it.** The login proxy hosts a page that mirrors
Amazon's real sign-in form so you can authenticate through it. If this page
is ever reachable from the public internet, it gets flagged as phishing —
this is exactly what happened on the old domain. It must only ever be
reached through an SSH tunnel.

```bash
# pick a port NOT already used by the frontend (3001) — e.g. 3011
# in backend/.env:
ALEXA_PROXY_PORT=3011
ALEXA_PROXY=true

pm2 restart sautaladhan-backend
```

On your **local machine** (not the server):
```bash
ssh -L 3011:localhost:3011 deploy@<server-ip>
```
Then open `http://localhost:3011` in your own browser, log in with Amazon,
confirm the console shows `🍪 Cookie data saved`. Then:

```bash
# back on the server
# set ALEXA_PROXY=false in .env
pm2 restart sautaladhan-backend
```

Verify with `ufw status` that the proxy port was never opened in the
firewall at any point in this process.

## 9. Verify before going live

```bash
curl -I https://sautaladhan.com/health
pm2 status
pm2 logs sautaladhan-backend --lines 50
sudo ufw status verbose   # confirm ONLY 22, 80, 443 are open
```

- [ ] `/api/auth/callback` completes a real Amazon login round-trip end to end
- [ ] A test prayer trigger fires and plays audio on a real device
- [ ] `trigger_log` table is being written to
- [ ] Leave it running through at least one overnight Isha→Fajr gap and
      confirm Fajr still fires — this is the specific window that failed
      before

## 10. Ongoing

- Check `pm2 logs sautaladhan-backend` and the `trigger_log` table
  regularly — silence for months is what let the original bug go
  undetected. A simple daily check ("did any trigger succeed in the last
  25 hours?") would have caught it within a day.
- Never point `ALEXA_PROXY_IP` at anything other than `127.0.0.1`.
- Rotate `JWT_SECRET` / `ENCRYPTION_KEY` if this server is ever compromised
  or decommissioned — don't carry them to a future migration either.
