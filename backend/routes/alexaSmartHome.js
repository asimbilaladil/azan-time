const router = require('express').Router();
const crypto = require('crypto');
const db     = require('../database/mysql');
const axios  = require('axios');

router.post('/', async (req, res) => {
  const directive = req.body;
  const namespace = directive?.directive?.header?.namespace;
  const name      = directive?.directive?.header?.name;
  console.log(`Smart Home directive: ${namespace}/${name}`);
  try {
    if (namespace === 'Alexa.Discovery' && name === 'Discover')       return res.json(await handleDiscovery(directive));
    if (namespace === 'Alexa.PowerController')                         return res.json(await handlePowerController(directive));
    if (namespace === 'Alexa' && name === 'ReportState')               return res.json(handleReportState(directive));
    if (namespace === 'Alexa.Authorization' && name === 'AcceptGrant') return res.json(await handleAcceptGrant(directive));
    res.json({});
  } catch (err) {
    console.error('Smart Home error:', err.message);
    res.status(500).json({});
  }
});

// ── Discovery — single doorbell device ───────────────────────────────────────
// Keep-alive now uses a silent ChangeReport instead of DoorbellPress,
// so we only need one device. Attach your Alexa routine to "Azan".
async function handleDiscovery(directive) {
  const [[user]] = await db.query('SELECT id FROM users WHERE is_active = TRUE LIMIT 1');
  const userId     = user?.id || 1;
  const endpointId = `azan-doorbell-${userId}`;

  await db.query('UPDATE users SET device_id = ? WHERE id = ?', [endpointId, userId]);
  console.log(`✅ Device registered: ${endpointId} for user ${userId}`);

  return {
    event: {
      header: {
        namespace:      'Alexa.Discovery',
        name:           'Discover.Response',
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
        ]
      }
    }
  };
}

// ── Power Controller ──────────────────────────────────────────────────────────
async function handlePowerController(directive) {
  const endpointId       = directive?.directive?.endpoint?.endpointId;
  const dirName          = directive?.directive?.header?.name;
  const correlationToken = directive?.directive?.header?.correlationToken;
  return {
    event: {
      header: {
        namespace:        'Alexa',
        name:             'Response',
        payloadVersion:   '3',
        messageId:        crypto.randomUUID(),
        correlationToken
      },
      endpoint: { endpointId },
      payload:  {}
    },
    context: {
      properties: [{
        namespace:                 'Alexa.PowerController',
        name:                      'powerState',
        value:                     dirName === 'TurnOn' ? 'ON' : 'OFF',
        timeOfSample:              new Date().toISOString(),
        uncertaintyInMilliseconds: 200
      }]
    }
  };
}

// ── Report State ──────────────────────────────────────────────────────────────
function handleReportState(directive) {
  return {
    event: {
      header: {
        namespace:      'Alexa',
        name:           'StateReport',
        payloadVersion: '3',
        messageId:      crypto.randomUUID()
      },
      endpoint: { endpointId: directive?.directive?.endpoint?.endpointId },
      payload:  {}
    },
    context: {
      properties: [{
        namespace:                 'Alexa.PowerController',
        name:                      'powerState',
        value:                     'OFF',
        timeOfSample:              new Date().toISOString(),
        uncertaintyInMilliseconds: 200
      }]
    }
  };
}

// ── Accept Grant — saves event token + refresh token ─────────────────────────
async function handleAcceptGrant(directive) {
  const grantCode    = directive.directive.payload.grant.code;
  const granteeToken = directive.directive.payload.grantee?.token;

  // Identify which user is enabling the skill via their grantee bearer token
  let userId;
  if (granteeToken) {
    try {
      const { data: profile } = await axios.get('https://api.amazon.com/user/profile', {
        headers: { Authorization: `Bearer ${granteeToken}` },
        timeout: 5000
      });
      const [[matchedUser]] = await db.query(
        'SELECT id FROM users WHERE amazon_user_id = ?', [profile.user_id]
      );
      if (matchedUser) {
        userId = matchedUser.id;
        console.log(`✅ AcceptGrant: identified user ${userId} from grantee token`);
      }
    } catch (e) {
      console.warn('⚠️ AcceptGrant: could not identify user from grantee token:', e.message);
    }
  }

  // Fallback: find the most recently active user with a device_id
  if (!userId) {
    const [[fallbackUser]] = await db.query(
      'SELECT id FROM users WHERE device_id IS NOT NULL AND is_active = TRUE ORDER BY updated_at DESC LIMIT 1'
    );
    if (!fallbackUser) {
      throw new Error('AcceptGrant: no eligible user found — complete device discovery first');
    }
    userId = fallbackUser.id;
    console.warn(`⚠️ AcceptGrant: using fallback user ${userId}`);
  }

  const response = await axios.post(
    'https://api.amazon.com/auth/o2/token',
    new URLSearchParams({
      grant_type:    'authorization_code',
      code:          grantCode,
      client_id:     process.env.ALEXA_EVENT_CLIENT_ID,
      client_secret: process.env.ALEXA_EVENT_CLIENT_SECRET
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 8000 }
  );

  const eventToken        = response.data.access_token;
  const eventRefreshToken = response.data.refresh_token;
  const expiresIn         = response.data.expires_in;

  await db.query(
    `UPDATE users
     SET event_token = ?, event_refresh_token = ?,
         event_token_expires = DATE_ADD(NOW(), INTERVAL ? SECOND)
     WHERE id = ?`,
    [eventToken, eventRefreshToken, expiresIn, userId]
  );

  console.log(`✅ AcceptGrant: event token saved for user ${userId}, expires in ${expiresIn}s`);

  return {
    event: {
      header: {
        namespace:      'Alexa.Authorization',
        name:           'AcceptGrant.Response',
        payloadVersion: '3',
        messageId:      crypto.randomUUID()
      },
      payload: {}
    }
  };
}

module.exports = router;
