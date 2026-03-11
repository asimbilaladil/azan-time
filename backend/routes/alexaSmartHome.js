const router = require('express').Router();
const crypto = require('crypto');
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
  const [[user]] = await db.query('SELECT id FROM users WHERE is_active = TRUE LIMIT 1');
  const userId = user?.id || 1;
  const endpointId = `azan-doorbell-${userId}`;
  await db.query('UPDATE users SET device_id = ? WHERE id = ?', [endpointId, userId]);
  console.log(`✅ Device registered: ${endpointId} for user ${userId}`);
  return {
  event: {
    header: {
      namespace: "Alexa.Discovery",
      name: "Discover.Response",
      payloadVersion: "3",
      messageId: crypto.randomUUID()
    },
    payload: {
      endpoints: [
        {
          endpointId: "azan-doorbell-1",
          manufacturerName: "Azan Time",
          friendlyName: "Azan",
          description: "Azan prayer announcement doorbell",
          displayCategories: ["DOORBELL"],
          cookie: {},
          capabilities: [
            {
              type: "AlexaInterface",
              interface: "Alexa",
              version: "3"
            },
            {
              type: "AlexaInterface",
              interface: "Alexa.DoorbellEventSource",
              version: "3",
              proactivelyReported: true
            },
            {
              type: "AlexaInterface",
              interface: "Alexa.EndpointHealth",
              version: "3",
              properties: {
                supported: [
                  { name: "connectivity" }
                ],
                proactivelyReported: true,
                retrievable: true
              }
            }
          ]
        }
      ]
    }
  }
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
