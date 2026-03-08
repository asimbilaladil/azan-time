# 🕌 Alexa Skill Registration Guide

Complete step-by-step instructions for registering both Alexa skills required for Azan Time.

---

## Overview

Two skills are needed:

| Skill | Type | Purpose |
|-------|------|---------|
| **Azan Time** | Smart Home | Exposes a virtual "Azan" switch — the backend turns it ON at prayer time |
| **Saut Al Adhan** | Custom + AudioPlayer | Streams the correct Adhan MP3 when triggered by the routine |

**Flow:**
```
Backend turns ON "Azan" switch (Smart Home)
  ↓
Alexa Routine fires
  ↓
Saut Al Adhan skill plays Adhan MP3 (Custom Skill)
```

---

## Prerequisites

Before starting:

- [ ] Amazon Developer account at [developer.amazon.com](https://developer.amazon.com) (same Amazon account as your Alexa device)
- [ ] `azantime.de` is live with backend running (`pm2 status` shows all online)
- [ ] LWA app created with `LWA_CLIENT_ID` and `LWA_CLIENT_SECRET` in `backend/.env`
- [ ] `LWA_REDIRECT_URI=https://azantime.de/auth/callback` in `.env`

---

## Part 1 — T07: Smart Home Skill

### 1.1 Create the Skill

1. Go to [https://developer.amazon.com/alexa/console/ask](https://developer.amazon.com/alexa/console/ask)
2. Click **Create Skill**
3. Fill in:
   - **Skill name:** `Azan Time`
   - **Primary locale:** English (US)
4. Choose model: **Smart Home**
5. Choose hosting: **Provision your own**
6. Click **Create Skill**

### 1.2 Set the Endpoint

1. In the skill, go to the **Smart Home** tab
2. Set **Default endpoint** to:
   ```
   https://azantime.de/alexa/smart-home
   ```
3. Click **Save**

### 1.3 Configure Account Linking

1. Click **Account Linking** in the left sidebar
2. Fill in:

   | Field | Value |
   |-------|-------|
   | Authorization URI | `https://www.amazon.com/ap/oa` |
   | Access Token URI | `https://api.amazon.com/auth/o2/token` |
   | Client ID | Your `LWA_CLIENT_ID` from `.env` |
   | Client Secret | Your `LWA_CLIENT_SECRET` from `.env` |
   | Client Authentication Scheme | HTTP Basic |
   | Scope | `profile` |

3. **Copy all Redirect URLs** shown by Amazon and add them to your LWA Security Profile at [developer.amazon.com/settings/console/securityprofile](https://developer.amazon.com/settings/console/securityprofile)
4. Click **Save**

### 1.4 Copy Skill ID to .env

1. Go back to the skill homepage — find the **Skill ID** at the top  
   It looks like: `amzn1.ask.skill.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

2. On your VPS:
   ```bash
   nano /var/www/azan-time/backend/.env
   ```
   Set:
   ```env
   ALEXA_SMART_HOME_SKILL_ID=amzn1.ask.skill.YOUR-ID-HERE
   ```

3. Restart backend:
   ```bash
   pm2 restart azantime-backend
   ```

### 1.5 Test — Discover the Azan Device

1. Open the **Alexa app** on your phone
2. Go to **More → Skills & Games**, search for "Azan Time", tap **Enable**
3. Complete the account linking flow (redirects to azantime.de)
4. Say **"Alexa, discover devices"** or go to **Devices → +**
5. ✅ **"Azan"** should appear as a switch in your Alexa app

---

## Part 2 — T08: Custom Skill (AudioPlayer)

### 2.1 Create the Skill

1. Go to [https://developer.amazon.com/alexa/console/ask](https://developer.amazon.com/alexa/console/ask)
2. Click **Create Skill**
3. Fill in:
   - **Skill name:** `Saut Al Adhan`
   - **Primary locale:** English (US)
4. Choose model: **Custom**
5. Choose hosting: **Provision your own**
6. Choose template: **Start from scratch**
7. Click **Create Skill**

### 2.2 Set Invocation Name

1. Click **Invocations → Skill Invocation Name** in the left sidebar
2. Set invocation name to:
   ```
   saut al adhan
   ```
3. Click **Save Model**

### 2.3 Enable AudioPlayer Interface

> ⚠️ **Required** — without this the Adhan audio will not play.

1. Click **Interfaces** in the left sidebar
2. Toggle **ON: Audio Player**
3. Click **Save Interfaces**

### 2.4 Set the Endpoint

1. Click **Endpoint** in the left sidebar
2. Select **HTTPS**
3. Set **Default Region** to:
   ```
   https://azantime.de/alexa/custom
   ```
4. SSL certificate type: **My development endpoint has a certificate from a trusted certificate authority**
5. Click **Save Endpoints**

### 2.5 Set the Interaction Model

1. Click **JSON Editor** in the left sidebar (under Interaction Model)
2. Replace the entire content with:

```json
{
  "interactionModel": {
    "languageModel": {
      "invocationName": "saut al adhan",
      "intents": [
        { "name": "AMAZON.CancelIntent", "samples": [] },
        { "name": "AMAZON.StopIntent", "samples": [] },
        { "name": "AMAZON.PauseIntent", "samples": [] },
        { "name": "AMAZON.ResumeIntent", "samples": [] },
        { "name": "AMAZON.HelpIntent", "samples": [] }
      ]
    }
  }
}
```

3. Click **Save Model**
4. Click **Build Model** — wait ~30 seconds for the build to complete

### 2.6 Configure Account Linking

Same as the Smart Home skill:

1. Click **Account Linking** in the left sidebar
2. Fill in the same values:

   | Field | Value |
   |-------|-------|
   | Authorization URI | `https://www.amazon.com/ap/oa` |
   | Access Token URI | `https://api.amazon.com/auth/o2/token` |
   | Client ID | Your `LWA_CLIENT_ID` |
   | Client Secret | Your `LWA_CLIENT_SECRET` |
   | Scope | `profile` |

3. Click **Save**

### 2.7 Copy Skill ID to .env

1. Go back to skill homepage — copy the **Skill ID**

2. On your VPS:
   ```bash
   nano /var/www/azan-time/backend/.env
   ```
   Set:
   ```env
   ALEXA_SKILL_ID=amzn1.ask.skill.YOUR-CUSTOM-SKILL-ID-HERE
   ```

3. Restart backend:
   ```bash
   pm2 restart azantime-backend
   ```

### 2.8 Test in Simulator

1. In the Alexa Developer Console, go to the **Test** tab
2. Set testing to **Development**
3. Type: `open saut al adhan`
4. ✅ You should see an `AudioPlayer.Play` directive in the JSON response

> If you see `AudioPlayer.Play` — T08 is complete!

---

## Part 3 — Create the Alexa Routine

This is the final step that connects both skills together.

1. Open the **Alexa app** on your phone
2. Go to **More → Routines → +** (create new)
3. **When this happens:** Smart Home → Azan → Turned On
4. **Add action:** Skills → Saut Al Adhan
5. **Choose your Echo device**
6. **Save** the routine

✅ Done! Now at every prayer time:
```
Backend turns ON "Azan" switch
  → Alexa routine fires
  → Saut Al Adhan plays the Adhan MP3 🔊
```

---

## Final Checklist

- [ ] Smart Home skill created with endpoint `azantime.de/alexa/smart-home`
- [ ] Smart Home account linking configured
- [ ] `ALEXA_SMART_HOME_SKILL_ID` added to `.env`
- [ ] "Azan" device discovered in Alexa app
- [ ] Custom skill created with invocation name `saut al adhan`
- [ ] AudioPlayer interface enabled
- [ ] Custom skill endpoint set to `azantime.de/alexa/custom`
- [ ] Interaction model JSON saved and built
- [ ] Custom skill account linking configured
- [ ] `ALEXA_SKILL_ID` added to `.env`
- [ ] Test simulator shows `AudioPlayer.Play`
- [ ] Alexa Routine created (Azan switch ON → Saut Al Adhan)

---

## Troubleshooting

**"Azan" device not discovered**
- Check that the Smart Home endpoint is reachable: `curl https://azantime.de/alexa/smart-home`
- Check backend logs: `pm2 logs azantime-backend --lines 30`

**AudioPlayer.Play not showing in simulator**
- Make sure AudioPlayer interface is enabled and model was rebuilt after enabling it
- Check that account linking is complete in the test environment

**Routine not firing**
- Make sure the routine trigger is set to the Azan **switch** device, not a scene
- Check `pm2 logs azantime-backend` around prayer time to confirm the trigger fires

**Backend crash after adding Skill IDs**
- Verify `.env` has no extra spaces around the `=` sign
- Run `node server.js` directly to see any startup errors
