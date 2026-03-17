const axios  = require('axios');
const crypto = require('crypto');
const db     = require('../database/mysql');

const ALEXA_API_URL = 'https://api.eu.amazonalexa.com/v3/events';

async function triggerAlexaDevice(user, prayer) {
  let eventToken = user.event_token;

  const expiresAt = user.event_token_expires ? new Date(user.event_token_expires) : null;
  if (!eventToken || !expiresAt || expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    console.log(`🔄 Event token expired for user ${user.id}, refreshing...`);
    eventToken = await refreshEventToken(user.id);
  }

  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const response = await axios.post(ALEXA_API_URL, buildDoorbellEvent(user.device_id, eventToken), {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${eventToken}` },
        timeout: 10000
      });
      console.log(`✅ Doorbell triggered ${user.device_id} (${prayer}) — ${response.status}`);
      return true;
    } catch (err) {
      const status = err.response?.status;
      console.error(`❌ Trigger failed [${status}] attempt ${attempt}/3:`, JSON.stringify(err.response?.data));

      if (status === 401) {
        console.log(`🔄 Got 401, refreshing token...`);
        eventToken = await refreshEventToken(user.id);
      
        // IMPORTANT: rebuild event with new token
        continue;
      } else if (status === 500 && attempt < 3) {
        console.log(`⚠️ Alexa 500, waiting 15s before retry...`);
        await new Promise(r => setTimeout(r, 20000));
      } else {
        throw new Error(`Alexa trigger failed: ${err.message}`);
      }

      if (attempt === 3) {
        throw new Error(`Alexa trigger failed after 3 attempts`);
      }
    }
  }
}



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
      timeout: 8000  // ← ADD THIS
    }
  );

  const newToken        = response.data.access_token;
  const newRefreshToken = response.data.refresh_token;
  const expiresIn       = response.data.expires_in;

  await db.query(
    `UPDATE users SET event_token=?, event_refresh_token=?, event_token_expires=DATE_ADD(NOW(), INTERVAL ? SECOND) WHERE id=?`,
    [newToken, newRefreshToken, expiresIn, userId]
  );

  console.log(`✅ Event token refreshed for user ${userId}, expires in ${expiresIn}s`);
  return newToken;
}

function buildDoorbellEvent(endpointId, token) {
  return {
    context: {
      properties: [{
        namespace: 'Alexa.EndpointHealth',
        name: 'connectivity',
        value: { value: 'OK' },
        timeOfSample: new Date().toISOString(),
        uncertaintyInMilliseconds: 0
      }]
    },
    event: {
      header: {
        messageId: crypto.randomUUID(),
        namespace: 'Alexa.DoorbellEventSource',
        name: 'DoorbellPress',
        payloadVersion: '3'
      },
      endpoint: {
        scope: { type: 'BearerToken', token },
        endpointId
      },
      payload: {
        cause: { type: 'PHYSICAL_INTERACTION' },
        timestamp: new Date().toISOString()
      }
    }
  };
}

module.exports = { triggerAlexaDevice, refreshEventToken };
