const axios  = require('axios');
const crypto = require('crypto');
const db     = require('../database/mysql');

const ALEXA_API_URL = 'https://api.eu.amazonalexa.com/v3/events';

// ── Prayer doorbell trigger (with self-healing) ──────────────────────────────
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

      const status = response.status;
      console.log(`✅ Doorbell triggered ${user.device_id} (${prayer}) — ${status}`);

      // SELF-HEALING: if we get 204 instead of 202, the endpoint binding
      // has decayed. Send AddOrUpdateReport to re-register the endpoint,
      // then retry the DoorbellPress.
      if (status === 204 && attempt <= 2) {
        console.log(`⚠️ Got 204 — endpoint binding stale. Sending AddOrUpdateReport to refresh...`);
        try {
          await sendAddOrUpdateReport(user.device_id, eventToken);
          console.log(`✅ AddOrUpdateReport sent. Retrying DoorbellPress in 3s...`);
          await new Promise(r => setTimeout(r, 3000));
          continue; // retry the DoorbellPress
        } catch (healErr) {
          console.error(`❌ AddOrUpdateReport failed:`, healErr.response?.data || healErr.message);
        }
      }

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

// ── Proactive Discovery: AddOrUpdateReport ────────────────────────────────────
// Sends a proactive discovery event to refresh the doorbell endpoint binding
// with Alexa. This tells Alexa "this device still exists for this user" and
// keeps the routine association alive.
// See: https://developer.amazon.com/en-US/docs/alexa/device-apis/alexa-discovery.html
async function sendAddOrUpdateReport(endpointId, token) {
  const payload = {
    event: {
      header: {
        namespace:      'Alexa.Discovery',
        name:           'AddOrUpdateReport',
        payloadVersion: '3',
        messageId:      crypto.randomUUID()
      },
      payload: {
        endpoints: [
          {
            endpointId,
            manufacturerName:  'Azan Time',
            friendlyName:      'Azan',
            description:       'Azan prayer announcement doorbell',
            displayCategories: ['DOORBELL'],
            cookie:            {},
            capabilities: [
              {
                type:      'AlexaInterface',
                interface: 'Alexa',
                version:   '3'
              },
              {
                type:      'AlexaInterface',
                interface: 'Alexa.PowerController',
                version:   '3',
                properties: {
                  supported:           [{ name: 'powerState' }],
                  proactivelyReported: false,
                  retrievable:         false
                }
              },
              {
                type:                'AlexaInterface',
                interface:           'Alexa.DoorbellEventSource',
                version:             '3',
                proactivelyReported: true
              },
              {
                type:      'AlexaInterface',
                interface: 'Alexa.EndpointHealth',
                version:   '3',
                properties: {
                  supported:           [{ name: 'connectivity' }],
                  proactivelyReported: true,
                  retrievable:         true
                }
              }
            ]
          }
        ],
        scope: {
          type:  'BearerToken',
          token: token
        }
      }
    }
  };

  const response = await axios.post(ALEXA_API_URL, payload, {
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`
    },
    timeout: 10000
  });

  console.log(`✅ AddOrUpdateReport response: ${response.status}`);
  return response.status;
}

// ── Periodic endpoint refresh ─────────────────────────────────────────────────
// Call this from the scheduler every few hours to keep the endpoint binding
// fresh with Alexa, preventing the 204 decay.
async function refreshEndpointBinding(user) {
  const [[dbUser]] = await db.query(
    'SELECT event_token, event_token_expires, device_id FROM users WHERE id = ?',
    [user.id]
  );

  if (!dbUser?.event_token || !dbUser?.device_id) {
    console.warn(`⚠️ Cannot refresh endpoint for user ${user.id} — missing token or device`);
    return;
  }

  let token = dbUser.event_token;
  const expiresAt = dbUser.event_token_expires
    ? new Date(dbUser.event_token_expires)
    : null;

  if (!expiresAt || expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    token = await refreshEventToken(user.id);
  }

  await sendAddOrUpdateReport(dbUser.device_id, token);
}

// ── KEEP-ALIVE DISABLED ──────────────────────────────────────────────────────
// ChangeReport is INVALID for doorbell devices — Alexa returns 400.
// Do not use. Kept as no-op for backward compatibility.
async function sendSilentKeepAlive(user) {
  console.log(`⚠️ sendSilentKeepAlive called but DISABLED — use refreshEndpointBinding instead`);
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

module.exports = {
  triggerAlexaDevice,
  refreshEventToken,
  sendSilentKeepAlive,
  refreshEndpointBinding,
  sendAddOrUpdateReport
};
