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
  const token = directive?.directive?.payload?.scope?.token;
  let userId = null;

  if (token) {
    try {
      // Call Amazon profile API with the token to get amazon_user_id
      const profile = await axios.get('https://api.amazon.com/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      const amazonUserId = profile.data?.user_id;
      console.log(`Discovery: amazon_user_id=${amazonUserId}`);

      if (amazonUserId) {
        const [[user]] = await db.query(
          'SELECT id FROM users WHERE amazon_user_id = ? AND is_active = 1',
          [amazonUserId]
        );
        if (user) userId = user.id;
      }
    } catch (err) {
      console.error('Discovery token lookup failed:', err.message);
    }
  }

  const endpointId = userId ? `azan-device-${userId}` : 'azan-device-unknown';

  if (userId) {
    await db.query('UPDATE users SET device_id = ? WHERE id = ?', [endpointId, userId]);
    console.log(`✅ Device registered: ${endpointId} for user ${userId}`);
  } else {
    console.warn('⚠️  Discovery: could not match token to a user');
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
