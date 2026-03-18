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

// ── Shared capability set ─────────────────────────────────────────────────────
function doorbellCapabilities() {
  return [
    {
      type: 'AlexaInterface',
      interface: 'Alexa',
      version: '3'
    },
    {
      type: 'AlexaInterface',
      interface: 'Alexa.PowerController',
      version: '3',
      properties: {
        supported: [{ name: 'powerState' }],
        proactivelyReported: false,
        retrievable: false
      }
    },
    {
      type: 'AlexaInterface',
      interface: 'Alexa.DoorbellEventSource',
      version: '3',
      proactivelyReported: true
    },
    {
      type: 'AlexaInterface',
      interface: 'Alexa.EndpointHealth',
      version: '3',
      properties: {
        supported: [{ name: 'connectivity' }],
        proactivelyReported: true,
        retrievable: true
      }
    }
  ];
}

// ── Discovery ─────────────────────────────────────────────────────────────────
// Returns TWO endpoints:
//   1. "Azan"      — real doorbell, attach your Alexa routine to this one
//   2. "Azan Ping" — keep-alive only, do NOT attach any routine to this one
async function handleDiscovery(directive) {
  const [[user]] = await db.query('SELECT id FROM users WHERE is_active = TRUE LIMIT 1');
  const userId     = user?.id || 1;
  const endpointId = `azan-doorbell-${userId}`;
  const pingId     = `azan-doorbell-${userId}-ping`;

  await db.query('UPDATE users SET device_id = ? WHERE id = ?', [endpointId, userId]);
  console.log(`✅ Device registered: ${endpointId} (prayer) + ${pingId} (keepalive) for user ${userId}`);

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
          // ── Real prayer doorbell — create your Alexa routine for THIS one ──
          {
            endpointId,
            manufacturerName:    'Azan Time',
            friendlyName:        'Azan',
            description:         'Azan prayer announcement — attach your Alexa routine here',
            displayCategories:   ['DOORBELL'],
            cookie:              {},
            capabilities:        doorbellCapabilities()
          },
          // ── Keep-alive ping device — DO NOT attach any routine to this ──
          {
            endpointId:          pingId,
            manufacturerName:    'Azan Time',
            friendlyName:        'Azan Ping',
            description:         'Internal keep-alive device — do not attach any routine',
            displayCategories:   ['DOORBELL'],
            cookie:              {},
            capabilities:        doorbellCapabilities()
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
        namespace:                'Alexa.PowerController',
        name:                     'powerState',
        value:                    dirName === 'TurnOn' ? 'ON' : 'OFF',
        timeOfSample:             new Date().toISOString(),
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
        namespace:                'Alexa.PowerController',
        name:                     'powerState',
        value:                    'OFF',
        timeOfSample:             new Date().toISOString(),
        uncertaintyInMilliseconds: 200
      }]
    }
  };
}

// ── Accept Grant — saves event token + refresh token ─────────────────────────
async function handleAcceptGrant(directive) {
  const grantCode = directive.directive.payload.grant.code;

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

  const [[user]] = await db.query(
    'SELECT id FROM users WHERE device_id IS NOT NULL LIMIT 1'
  );

  await db.query(
    `UPDATE users
     SET event_token = ?, event_refresh_token = ?,
         event_token_expires = DATE_ADD(NOW(), INTERVAL ? SECOND)
     WHERE id = ?`,
    [eventToken, eventRefreshToken, expiresIn, user.id]
  );

  console.log(`✅ AcceptGrant: event token saved for user ${user.id}, expires in ${expiresIn}s`);

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
