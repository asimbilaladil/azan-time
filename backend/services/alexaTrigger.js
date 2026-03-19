const axios  = require('axios');
const crypto = require('crypto');
const db     = require('../database/mysql');

const ALEXA_API_URL = 'https://api.eu.amazonalexa.com/v3/events';

// ── Prayer doorbell trigger ───────────────────────────────────────────────────
async function triggerAlexaDevice(user, prayer) {
  let eventToken = user.event_token;

  // Always reload fresh token from DB
  const [[dbUser]] = await db.query(
    'SELECT event_token, event_token_expires FROM users WHERE id = ?',
    [user.id]
  );

  if (dbUser?.event_token) {
    eventToken = dbUser.event_token;
  }

  const expiresAt = dbUser?.event_token_expires
    ? new Date(dbUser.event_token_expires)
    : null;

  if (!eventToken || !expiresAt || expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    console.log(`🔄 Event token expired for user ${user.id}, refreshing...`);
    eventToken = await refreshEventToken(user.id);
  }

  let consecutive401 = 0;

  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const payload = buildDoorbellEvent(user.device_id, eventToken);
      const response = await axios.post(
        ALEXA_API_URL,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${eventToken}`
          },
          timeout: 10000
        }
      );
      console.log(`✅ Doorbell triggered ${user.device_id} (${prayer}) — ${response.status}`);
      return true;
    } catch (err) {
      const status = err.response?.status;

      console.error(
        `❌ Trigger failed [${status}] attempt ${attempt}/6:`,
        JSON.stringify(err.response?.data)
      );

      if (status === 401) {
        if (++consecutive401 >= 2) {
          throw new Error('Two consecutive 401s — check ALEXA_EVENT_CLIENT_ID/SECRET');
        }
        console.log(`🔄 Got 401, refreshing token...`);
        eventToken = await refreshEventToken(user.id);
        continue;
      }

      if (status === 500 && attempt < 6) {
        if (attempt === 3) {
          console.log(`🔄 Mid-retry token refresh for safety...`);
          eventToken = await refreshEventToken(user.id);
        }
        const delay = [2000, 5000, 10000, 15000, 20000][attempt - 1] || 20000;
        console.log(`⚠️ Alexa 500 — retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      if (attempt === 6) {
        throw new Error(`Alexa trigger failed after 6 attempts`);
      }
    }
  }
}

// ── KEEP-ALIVE REMOVED ───────────────────────────────────────────────────────
// The silent keep-alive via ChangeReport does NOT work for doorbell devices.
// Alexa docs: "The Alexa.DoorbellEventSource interface doesn't define any
// proactively reportable properties." — so ChangeReport returns 400
// INVALID_REQUEST_EXCEPTION. This function is kept as a no-op so any existing
// callers don't crash, but it does nothing.
async function sendSilentKeepAlive(user) {
  console.log(`⚠️ sendSilentKeepAlive called but DISABLED — ChangeReport is invalid for doorbell devices`);
  // Do nothing. ChangeReport on a DoorbellEventSource device returns 400.
  // The proactive token refresh cron keeps the token fresh without this.
}

// ── Token refresh ─────────────────────────────────────────────────────────────
async function refreshEventToken(userId) {
  const [[user]] = await db.query(
    'SELECT event_refresh_token FROM users WHERE id = ?', [userId]
  );

  if (!user?.event_refresh_token) {
    throw new Error('No event_refresh_token found — user must re-enable skill in Alexa app');
  }

  console.log(`🔑 Attempting token refresh for user ${userId}, refresh_token starts with: ${user.event_refresh_token.substring(0, 20)}...`);

  const response = await axios.post(
    'https://api.amazon.com/auth/o2/token',
    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: user.event_refresh_token,
      client_id:     process.env.ALEXA_EVENT_CLIENT_ID,
      client_secret: process.env.ALEXA_EVENT_CLIENT_SECRET,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 8000
    }
  );

  const newToken        = response.data.access_token;
  const newRefreshToken = response.data.refresh_token;
  const expiresIn       = response.data.expires_in;

  await db.query(
    `UPDATE users
     SET event_token = ?, event_refresh_token = ?,
         event_token_expires = DATE_ADD(NOW(), INTERVAL ? SECOND)
     WHERE id = ?`,
    [newToken, newRefreshToken, expiresIn, userId]
  );

  console.log(`✅ Event token refreshed for user ${userId}, expires in ${expiresIn}s`);
  return newToken;
}

// ── Payload builders ──────────────────────────────────────────────────────────

// FIX 1: Added scope.BearerToken inside event.endpoint
//   The Alexa DoorbellEventSource docs require the bearer token in the
//   endpoint scope, not just in the HTTP Authorization header.
//   See: https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-doorbelleventsource.html
//
// FIX 2: Changed cause.type from "APP_INTERACTION" to "PHYSICAL_INTERACTION"
//   The Alexa docs example for DoorbellPress uses PHYSICAL_INTERACTION.
function buildDoorbellEvent(endpointId, token) {
  return {
    context: {
      properties: [{
        namespace:                'Alexa.EndpointHealth',
        name:                     'connectivity',
        value:                    { value: 'OK' },
        timeOfSample:             new Date().toISOString(),
        uncertaintyInMilliseconds: 0
      }]
    },
    event: {
      header: {
        messageId:      crypto.randomUUID(),
        namespace:      'Alexa.DoorbellEventSource',
        name:           'DoorbellPress',
        payloadVersion: '3'
      },
      endpoint: {
        scope: {
          type:  'BearerToken',
          token: token
        },
        endpointId
      },
      payload: {
        cause:     { type: 'PHYSICAL_INTERACTION' },
        timestamp: new Date().toISOString()
      }
    }
  };
}

// NOTE: buildChangeReport is kept for reference but should NOT be used
// with doorbell-type devices — Alexa returns 400 INVALID_REQUEST_EXCEPTION.
function buildChangeReport(endpointId, token) {
  const now = new Date().toISOString();
  return {
    context: {
      properties: [{
        namespace:                'Alexa.EndpointHealth',
        name:                     'connectivity',
        value:                    { value: 'OK' },
        timeOfSample:             now,
        uncertaintyInMilliseconds: 0
      }]
    },
    event: {
      header: {
        messageId:      crypto.randomUUID(),
        namespace:      'Alexa',
        name:           'ChangeReport',
        payloadVersion: '3'
      },
      endpoint: {
        scope: {
          type:  'BearerToken',
          token: token
        },
        endpointId
      },
      payload: {
        change: {
          cause: { type: 'APP_INTERACTION' },
          properties: [{
            namespace:                'Alexa.EndpointHealth',
            name:                     'connectivity',
            value:                    { value: 'OK' },
            timeOfSample:             now,
            uncertaintyInMilliseconds: 0
          }]
        }
      }
    }
  };
}

module.exports = { triggerAlexaDevice, refreshEventToken, sendSilentKeepAlive };
