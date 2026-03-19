const router = require('express').Router();
const db     = require('../database/mysql');
const { initAlexa, triggerAzan, getDevices, isReady } = require('../services/alexaDirectService');

// GET /api/alexa-direct/status — check if alexa-remote2 is connected
router.get('/status', (req, res) => {
  res.json({
    ready: isReady(),
    devices: isReady() ? getDevices() : []
  });
});

// GET /api/alexa-direct/devices — list all Echo devices
router.get('/devices', (req, res) => {
  if (!isReady()) {
    return res.status(503).json({
      error: 'Alexa Remote not initialized. Start server with ALEXA_PROXY=true to set up.'
    });
  }
  res.json(getDevices());
});

// POST /api/alexa-direct/set-device — save Echo device serial for a user
// Body: { userId: 1, serial: "XXXXXXXXX" }
router.post('/set-device', async (req, res) => {
  const { userId, serial } = req.body;
  if (!userId || !serial) {
    return res.status(400).json({ error: 'userId and serial required' });
  }

  try {
    await db.query(
      'UPDATE users SET alexa_device_serial = ? WHERE id = ?',
      [serial, userId]
    );
    res.json({ success: true, message: `Device ${serial} set for user ${userId}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alexa-direct/test — trigger azan on the first user's device
router.get('/test', async (req, res) => {
  if (!isReady()) {
    return res.status(503).json({
      error: 'Alexa Remote not initialized'
    });
  }

  try {
    const [[user]] = await db.query(
      'SELECT id, alexa_device_serial FROM users WHERE alexa_device_serial IS NOT NULL LIMIT 1'
    );

    if (!user) {
      return res.status(404).json({
        error: 'No user with alexa_device_serial set. Use /api/alexa-direct/devices to find your device, then POST /api/alexa-direct/set-device'
      });
    }

    await triggerAzan(user.alexa_device_serial, 'manual_test');
    res.json({ success: true, message: 'Azan triggered via direct command' });
  } catch (err) {
    console.error('❌ Direct test failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
