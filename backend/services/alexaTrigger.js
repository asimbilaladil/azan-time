const axios  = require('axios');
const crypto = require('crypto');
const { decrypt } = require('./encryption');
const { refreshAccessToken } = require('./authService');

const ALEXA_API_URL = 'https://api.amazonalexa.com/v3/events';

/**
 * Send a ChangeReport (TurnOn) event to Alexa Event Gateway,
 * which triggers the user's routine.
 * Auto-refreshes token if expired.
 *
 * @param {Object} user   - DB user row (with access_token, refresh_token, token_expires_at, device_id)
 * @param {string} prayer - 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
 */
async function triggerAlexaDevice(user, prayer) {
  let accessToken = decrypt(user.access_token);

  // Pre-emptive refresh if token expires within 5 minutes
  const expiresAt = user.token_expires_at ? new Date(user.token_expires_at) : null;
  if (expiresAt && expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
    try {
      accessToken = await refreshAccessToken(user.id);
      console.log(`🔄 Pre-emptively refreshed token for user ${user.id}`);
    } catch (err) {
      console.error(`❌ Pre-emptive refresh failed for user ${user.id}:`, err.message);
    }
  }

  const payload = buildChangeReport(user.device_id, accessToken);

  try {
    const response = await axios.post(ALEXA_API_URL, payload, {
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      timeout: 10000,
    });
    console.log(`✅ Triggered device ${user.device_id} for user ${user.id} (${prayer}) — ${response.status}`);
    return true;
  } catch (err) {
    const status  = err.response?.status;
    const message = err.response?.data?.message || err.message;

    // On 401 try once more with fresh token
    if (status === 401) {
      console.warn(`⚠️  Got 401 for user ${user.id}, refreshing token...`);
      const newToken = await refreshAccessToken(user.id);
      const retryPayload = buildChangeReport(user.device_id, newToken);
      await axios.post(ALEXA_API_URL, retryPayload, {
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${newToken}` },
        timeout: 10000,
      });
      console.log(`✅ Retry triggered device ${user.device_id} for user ${user.id} (${prayer})`);
      return true;
    }

    console.error(`❌ Trigger failed for user ${user.id}: [${status}] ${message}`);
    throw new Error(`Alexa trigger failed: ${message}`);
  }
}

function buildChangeReport(endpointId, accessToken) {
  return {
    event: {
      header: {
        messageId:      crypto.randomUUID(),
        namespace:      'Alexa',
        name:           'ChangeReport',
        payloadVersion: '3',
      },
      endpoint: {
        scope: { type: 'BearerToken', token: accessToken },
        endpointId,
      },
      payload: {
        change: {
          cause: { type: 'APP_INTERACTION' },
          properties: [{
            namespace:                'Alexa.PowerController',
            name:                     'powerState',
            value:                    'ON',
            timeOfSample:             new Date().toISOString(),
            uncertaintyInMilliseconds: 0,
          }],
        },
      },
    },
    context: {},
  };
}

module.exports = { triggerAlexaDevice };
