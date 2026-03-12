const router = require("express").Router();
const db = require("../database/mysql");
const { triggerAlexaDevice } = require("../services/alexaTrigger");

router.get("/doorbell", async (req, res) => {
  try {

    // get first registered user for testing
    const [[user]] = await db.query(
      "SELECT * FROM users LIMIT 1"
    );

    if (!user) {
      return res.status(404).json({
        error: "No users found in database"
      });
    }

    if (!user.device_id) {
      return res.status(400).json({
        error: "User has no Alexa device registered"
      });
    }

    await triggerAlexaDevice(user, "manual_test");

    res.json({
      success: true,
      message: "Doorbell event triggered"
    });

  } catch (err) {
    console.error("❌ Test trigger error:", err.message);

    res.status(500).json({
      error: err.message
    });
  }
});

module.exports = router;
