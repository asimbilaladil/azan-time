router.get('/doorbell', async (req, res) => {
  try {

    const params = new URLSearchParams();

    params.append("grant_type", "client_credentials");
    params.append("client_id", process.env.ALEXA_CLIENT_ID);
    params.append("client_secret", process.env.ALEXA_CLIENT_SECRET);
    params.append("scope", "alexa::events:skill");

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
            token
          },
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

    res.json({ success: true, alexa: alexaRes.data });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json(err.response?.data || err.message);
  }
});
