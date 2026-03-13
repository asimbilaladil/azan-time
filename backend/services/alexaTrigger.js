const axios  = require('axios');
const crypto = require('crypto');
const { decrypt } = require('./encryption');
const { refreshAccessToken } = require('./authService');

const ALEXA_API_URL = 'https://api.amazonalexa.com/v3/events';

async function triggerAlexaDevice(user, prayer) {

  const eventToken = user.event_token;

  const payload = buildDoorbellEvent(user.device_id, eventToken);

  console.log("📡 Sending DoorbellPress:", JSON.stringify(payload));

  const response = await axios.post(
      ALEXA_API_URL,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${eventToken}`
        },
        timeout: 10000
      }
  );

  console.log(`✅ Doorbell triggered ${user.device_id} (${prayer})`);

}
// async function triggerAlexaDevice(user, prayer) {
//   let accessToken = decrypt(user.access_token);
//
//   const expiresAt = user.token_expires_at ? new Date(user.token_expires_at) : null;
//   if (expiresAt && expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
//     try {
//       accessToken = await refreshAccessToken(user.id);
//     } catch (err) {
//       console.error(`❌ Pre-emptive refresh failed for user ${user.id}:`, err.message);
//     }
//   }
//
//   const payload = buildDoorbellEvent(user.device_id, accessToken);
//
//   // Helpful debug
//   console.log("📡 Sending DoorbellPress:", JSON.stringify(payload));
//
//   try {
//     const response = await axios.post(ALEXA_API_URL, payload, {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${accessToken}`
//       },
//       timeout: 10000
//     });
//
//     console.log(`✅ Doorbell triggered ${user.device_id} for user ${user.id} (${prayer}) — ${response.status}`);
//     return true;
//
//   } catch (err) {
//     const status = err.response?.status;
//     const message = err.response?.data?.message || err.message;
//
//     if (status === 401) {
//       const newToken = await refreshAccessToken(user.id);
//
//       await axios.post(ALEXA_API_URL, buildDoorbellEvent(user.device_id, newToken), {
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${newToken}`
//         },
//         timeout: 10000
//       });
//
//       console.log(`✅ Retry doorbell triggered for user ${user.id} (${prayer})`);
//       return true;
//     }
//
//     console.error(`❌ Trigger failed for user ${user.id}: [${status}] ${message}`);
//     throw new Error(`Alexa trigger failed: ${message}`);
//   }
// }

function buildDoorbellEvent(endpointId, token) {
  return {
    context: {
      properties: [
        {
          namespace: "Alexa.EndpointHealth",
          name: "connectivity",
          value: { value: "OK" },
          timeOfSample: new Date().toISOString(),
          uncertaintyInMilliseconds: 0
        }
      ]
    },
    event: {
      header: {
        messageId: crypto.randomUUID(),
        namespace: "Alexa.DoorbellEventSource",
        name: "DoorbellPress",
        payloadVersion: "3"
      },
      endpoint: {
        scope: {
          type: "BearerToken",
          token: token
        },
        endpointId: endpointId
      },
      payload: {
        cause: {
          type: "PHYSICAL_INTERACTION"
        },
        timestamp: new Date().toISOString()
      }
    }
  };
}

module.exports = { triggerAlexaDevice };
