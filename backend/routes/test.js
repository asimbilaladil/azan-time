const router = require("express").Router();
const db = require("../database/mysql");
const requireAuth = require("../middleware/auth");
const { triggerAlexaDevice } = require("../services/alexaTrigger");

/*
Test endpoint
Triggers Alexa DoorbellPress manually

GET /api/test/doorbell
*/

router.get("/doorbell", requireAuth, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Load user device + tokens
    const [[user]] = await db.query(
      "SELECT id, device_id, access_token, refresh_token, token_expires_at FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    if (!user.device_id) {
      return res.status(400).json({
        success: false,
        error: "No Alexa device registered"
      });
    }

    // Call Alexa trigger service
    await triggerAlexaDevice(user, "manual_test");

    return res.json({
      success: true,
      message: "Doorbell event sent to Alexa"
    });

  } catch (err) {
    console.error("❌ Test trigger error:", err.message);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
