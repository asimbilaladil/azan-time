const router = require('express').Router();
const crypto = require('crypto');
const axios  = require('axios');
const db     = require('../database/mysql');

/**
 * POST /alexa/smart-home
 */
router.post('/', async (req, res) => {
  const directive = req.body;
  const namespace = directive?.directive?.header?.namespace;
  const name      = directive?.directive?.header?.name;

  console.log(`Smart Home directive: ${namespace}/${name}`);

  try {
    if (namespace === 'Alexa.Discovery' && name === 'Discover') {
      return res.json(await handleDiscovery(directive));
    }
    if (namespace === 'Alexa.PowerController') {
      return res.json(await handlePowerController(directive));
    }
    if (namespace === 'Alexa' && name === 'ReportState') {
      return res.json(handleReportState(directive));
    }
    if (namespace === 'Alexa.Authorization' && name === 'AcceptGrant') {
      return res.json(handleAcceptGrant(directive));
    }
    res.json({});
  } catch (err) {
    console.error('Smart Home error:', err.message);
    res.status(500).json({});
  }
});

// ── Discovery ─────────────────────────────────────────────────────────────────
async function handleDiscovery(directive) {

  let userId = null;

  try {

    // Token sent by Alexa after account linking
    const amazonUserId =
      directive?.directive?.payload?.scope?.token ||
      directive?.directive?.endpoint?.scope?.token;

    console.log(`Discovery request received`);

    if (amazonUserId) {

      // Find user in DB
      const [rows] = await db.query(
        'SELECT id FROM users WHERE amazon_user_id = ?',
        [amazonUserId]
      );

      const user = rows[0];

      if (user) {
        userId = user.id;
        console.log(`User found: ${userId}`);
      } else {
        console.warn(`User not found for token`);
      }

    } else {
      console.warn(`No token received in discovery`);
    }

  } catch (err) {
    console.error('Discovery error:', err.message);
  }

  const endpointId = userId ? `azan-device-${userId}` : 'azan-device-unknown';

  // Save device_id in database
  if (userId) {
    try {
      await db.query(
        'UPDATE users SET device_id = ? WHERE id = ?',
        [endpointId, userId]
      );
      console.log(`✅ Device registered: ${endpointId}`);
    } catch (err) {
      console.error('Device save error:', err.message);
    }
  }

  // Alexa response
  return {
    event: {
      header: {
        namespace: 'Alexa.Discovery',
        name: 'Discover.Response',
        payloadVersion: '3',
        messageId: crypto.randomUUID(),
      },
      payload: {
        endpoints: [
          {
            endpointId,
            manufacturerName: 'Azan Time',
            friendlyName: 'Azan',
            description: 'Automatically plays Adhan at prayer times',
            displayCategories: ['SWITCH'],
            cookie: {},
            capabilities: [
              {
                type: 'AlexaInterface',
                interface: 'Alexa.PowerController',
                version: '3',
                properties: {
                  supported: [{ name: 'powerState' }],
                  proactivelyReported: false,
                  retrievable: false,
                },
              },
              {
                type: 'AlexaInterface',
                interface: 'Alexa',
                version: '3',
              },
            ],
          },
        ],
      },
    },
  };
}

// ── PowerController ───────────────────────────────────────────────────────────
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
        correlationToken,
      },
      endpoint: { endpointId },
      payload: {},
    },
    context: {
      properties: [{
        namespace:                 'Alexa.PowerController',
        name:                      'powerState',
        value:                     dirName === 'TurnOn' ? 'ON' : 'OFF',
        timeOfSample:              new Date().toISOString(),
        uncertaintyInMilliseconds: 200,
      }],
    },
  };
}

// ── ReportState ───────────────────────────────────────────────────────────────
function handleReportState(directive) {
  return {
    event: {
      header: {
        namespace: 'Alexa', name: 'StateReport',
        payloadVersion: '3', messageId: crypto.randomUUID(),
      },
      endpoint: { endpointId: directive?.directive?.endpoint?.endpointId },
      payload: {},
    },
    context: {
      properties: [{
        namespace: 'Alexa.PowerController', name: 'powerState', value: 'OFF',
        timeOfSample: new Date().toISOString(), uncertaintyInMilliseconds: 200,
      }],
    },
  };
}

// ── AcceptGrant ───────────────────────────────────────────────────────────────
function handleAcceptGrant(directive) {
  return {
    event: {
      header: {
        namespace: 'Alexa.Authorization', name: 'AcceptGrant.Response',
        payloadVersion: '3', messageId: crypto.randomUUID(),
      },
      payload: {},
    },
  };
}

module.exports = router;
