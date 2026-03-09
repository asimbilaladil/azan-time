const router = require('express').Router();
const crypto = require('crypto');
const axios  = require('axios');
const db     = require('../database/mysql');

router.post('/', async (req, res) => {
  const directive = req.body;
  const namespace = directive?.directive?.header?.namespace;
  const name      = directive?.directive?.header?.name;
  console.log(`Smart Home directive: ${namespace}/${name}`);
  try {
    if (namespace === 'Alexa.Discovery' && name === 'Discover') return res.json(await handleDiscovery(directive));
    if (namespace === 'Alexa.PowerController') return res.json(await handlePowerController(directive));
    if (namespace === 'Alexa' && name === 'ReportState') return res.json(handleReportState(directive));
    if (namespace === 'Alexa.Authorization' && name === 'AcceptGrant') return res.json(handleAcceptGrant(directive));
    res.json({});
  } catch (err) {
    console.error('Smart Home error:', err.message);
    res.status(500).json({});
  }
});

async function handleDiscovery(directive) {
  const token = directive?.directive?.payload?.scope?.token;
  let userId = null;

  if (token) {
    try {
      // Call Amazon API to get the user's amazon_user_id from the access token
      const profile = await axios.get('https://api.amazon.com/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });
      const amazonUserId = profile.data?.user_id;
      console.log(`Discovery: amazon_user_id=${amazonUserId}`);

      if (amazonUserId) {
        const [[user]] = await db.query(
          'SELECT id FROM users WHERE amazon_user_id = ? AND is_active = TRUE',
          [amazonUserId]
        );
        if (user) {
          userId = user.id;
          console.log(`User found: ${userId}`);
        } else {
          console.warn(`No user in DB with amazon_user_id=${amazonUserId}`);
          // Log all users for debugging
          const [allUsers] = await db.query('SELECT id, amazon_user_id FROM users');
          console.log('All users:', JSON.stringify(allUsers));
        }
      }
    } catch (err) {
      console.error('Profile API error:', err.message);
    }
  } else {
    console.warn('No token in discovery request');
  }

  const endpointId = userId ? `azan-device-${userId}` : 'azan-device-unknown';
  if (userId) {
    await db.query('UPDATE users SET device_id = ? WHERE id = ?', [endpointId, userId]);
    console.log(`✅ Device registered: ${endpointId} for user ${userId}`);
  }

  return {
    event: {
      header: { namespace: 'Alexa.Discovery', name: 'Discover.Response', payloadVersion: '3', messageId: crypto.randomUUID() },
      payload: {
        endpoints: [{
          endpointId,
          friendlyName: 'Azan',
          description: 'Automatically plays Adhan at prayer times',
          manufacturerName: 'Azan Time',
          displayCategories: ['SWITCH'],
          cookie: {},
          capabilities: [
            { type: 'AlexaInterface', interface: 'Alexa.PowerController', version: '3', properties: { supported: [{ name: 'powerState' }], proactivelyReported: false, retrievable: false } },
            { type: 'AlexaInterface', interface: 'Alexa', version: '3' },
          ],
        }],
      },
    },
  };
}

async function handlePowerController(directive) {
  const endpointId = directive?.directive?.endpoint?.endpointId;
  const dirName = directive?.directive?.header?.name;
  const correlationToken = directive?.directive?.header?.correlationToken;
  return {
    event: { header: { namespace: 'Alexa', name: 'Response', payloadVersion: '3', messageId: crypto.randomUUID(), correlationToken }, endpoint: { endpointId }, payload: {} },
    context: { properties: [{ namespace: 'Alexa.PowerController', name: 'powerState', value: dirName === 'TurnOn' ? 'ON' : 'OFF', timeOfSample: new Date().toISOString(), uncertaintyInMilliseconds: 200 }] },
  };
}

function handleReportState(directive) {
  return {
    event: { header: { namespace: 'Alexa', name: 'StateReport', payloadVersion: '3', messageId: crypto.randomUUID() }, endpoint: { endpointId: directive?.directive?.endpoint?.endpointId }, payload: {} },
    context: { properties: [{ namespace: 'Alexa.PowerController', name: 'powerState', value: 'OFF', timeOfSample: new Date().toISOString(), uncertaintyInMilliseconds: 200 }] },
  };
}

function handleAcceptGrant(directive) {
  return { event: { header: { namespace: 'Alexa.Authorization', name: 'AcceptGrant.Response', payloadVersion: '3', messageId: crypto.randomUUID() }, payload: {} } };
}

module.exports = router;
