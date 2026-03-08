const router = require('express').Router();
const crypto = require('crypto');
const db     = require('../database/mysql');
const { decrypt } = require('../services/encryption');

/**
 * POST /alexa/smart-home
 * Handles all Alexa Smart Home directives.
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
    // Unknown directive — respond with empty OK
    res.json({});
  } catch (err) {
    console.error('Smart Home error:', err.message);
    res.status(500).json({});
  }
});

// ── Discovery: expose the virtual "Azan" switch ───────────────────────────────
async function handleDiscovery(directive) {
  const token = directive?.directive?.payload?.scope?.token;

  // Find the user by matching their decrypted access token
  let userId = null;
  if (token) {
    const [users] = await db.query(
      'SELECT id, access_token FROM users WHERE is_active = TRUE AND access_token IS NOT NULL'
    );
    for (const u of users) {
      try {
        if (decrypt(u.access_token) === token) { userId = u.id; break; }
      } catch {}
    }
  }

  const endpointId = userId ? `azan-device-${userId}` : 'azan-device-unknown';

  // Persist device_id so scheduler can trigger it
  if (userId) {
    await db.query('UPDATE users SET device_id = ? WHERE id = ?', [endpointId, userId]);
    console.log(`📱 Device registered: ${endpointId} for user ${userId}`);
  }

  return {
    event: {
      header: {
        namespace:      'Alexa.Discovery',
        name:           'Discover.Response',
        payloadVersion: '3',
        messageId:      crypto.randomUUID(),
      },
      payload: {
        endpoints: [{
          endpointId,
          friendlyName:      'Azan',
          description:       'Plays the Adhan automatically at prayer times',
          manufacturerName:  'Azan Time',
          displayCategories: ['SWITCH'],
          capabilities: [
            {
              type:      'AlexaInterface',
              interface: 'Alexa.PowerController',
              version:   '3',
              properties: {
                supported: [{ name: 'powerState' }],
                proactivelyReported: true,
                retrievable: true,
              },
            },
            {
              type: 'AlexaInterface', interface: 'Alexa.EndpointHealth', version: '3',
              properties: { supported: [{ name: 'connectivity' }], proactivelyReported: true, retrievable: true },
            },
            { type: 'AlexaInterface', interface: 'Alexa', version: '3' },
          ],
        }],
      },
    },
  };
}

// ── PowerController: respond to TurnOn / TurnOff ─────────────────────────────
async function handlePowerController(directive) {
  const endpointId       = directive?.directive?.endpoint?.endpointId;
  const dirName          = directive?.directive?.header?.name; // TurnOn | TurnOff
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
        namespace:                'Alexa.PowerController',
        name:                     'powerState',
        value:                    dirName === 'TurnOn' ? 'ON' : 'OFF',
        timeOfSample:             new Date().toISOString(),
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

// ── AcceptGrant (account linking) ─────────────────────────────────────────────
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
