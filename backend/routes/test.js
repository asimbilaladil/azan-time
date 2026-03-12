const router = require('express').Router();
const axios = require('axios');

router.get('/doorbell', async (req, res) => {
  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", "amzn1.application-oa2-client.6c00c2d528c74c0281bbbc2f06bb2b78");
    params.append("client_secret", "amzn1.oa2-cs.v1.8c1f5ea4a26b8e940bebcdc32a98fa6f9bc7742f078a3cdd194b1b87ab483def");
    params.append("scope", "profile:user_id");
    // STEP 1 — GET EVENT TOKEN
    const tokenRes = await axios.post(
      "https://api.amazon.com/auth/O2/token",
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    const token = tokenRes.data.access_token;

    console.log("EVENT TOKEN:", token);

    // STEP 2 — SEND DOORBELL EVENT
    const event = {
      event: {
        header: {
          namespace: "Alexa.DoorbellEventSource",
          name: "DoorbellPress",
          payloadVersion: "3",
          messageId: Date.now().toString()
        },
        endpoint: {
          endpointId: "azan-doorbell-1"
        },
        payload: {
          cause: { type: "PHYSICAL_INTERACTION" },
          timestamp: new Date().toISOString()
        }
      }
    };

    const alexaRes = await axios.post(
      "https://api.amazonalexa.com/v3/events",
      event,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      success: true,
      alexa: alexaRes.data
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json(err.response?.data || err.message);
  }
});

module.exports = router;
