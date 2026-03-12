const router = require("express").Router();
const axios = require("axios");

router.get("/doorbell", async (req, res) => {
  try {

    /*
    =============================
    STEP 1 — GET EVENT TOKEN
    =============================
    */

    const params = new URLSearchParams();

    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.LWA_CLIENT_ID);
    params.append("client_secret", process.env.LWA_CLIENT_SECRET);
    params.append("scope", "alexa::events:skill");

    const tokenResponse = await axios.post(
      "https://api.amazon.com/auth/O2/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const token = tokenResponse.data.access_token;

    console.log("Alexa Event Token:", token);

    /*
    =============================
    STEP 2 — CREATE DOORBELL EVENT
    =============================
    */

    const event = {
      context: {},
      event: {
        header: {
          namespace: "Alexa.DoorbellEventSource",
          name: "DoorbellPress",
          payloadVersion: "3",
          messageId: Date.now().toString()
        },
        endpoint: {
          scope: {
            type: "BearerToken",
            token: token
          },
          endpointId: process.env.ALEXA_ENDPOINT_ID
        },
        payload: {
          cause: {
            type: "PHYSICAL_INTERACTION"
          },
          timestamp: new Date().toISOString()
        }
      }
    };

    /*
    =============================
    STEP 3 — SEND EVENT TO ALEXA
    =============================
    */

    const alexaResponse = await axios.post(
      "https://api.amazonalexa.com/v3/events",
      event,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Alexa Response:", alexaResponse.data);

    return res.json({
      success: true,
      message: "Doorbell event sent successfully",
      alexaResponse: alexaResponse.data
    });

  } catch (error) {

    console.error(
      "Alexa Event Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });

  }
});

module.exports = router;
