const router = require('express').Router();
const { triggerAlexaDevice } = require('../services/alexaTrigger');
const db = require('../database/mysql');

router.get('/doorbell', async (req, res) => {
  try {

    const [[user]] = await db.query(
      "SELECT id, device_id, access_token, refresh_token, token_expires_at FROM users LIMIT 1"
    );

    if (!user) {
      return res.json({ error: "No user found" });
    }

    await triggerAlexaDevice(user, "test");

    res.json({
      success: true,
      message: "Doorbell trigger sent",
      device: user.device_id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
