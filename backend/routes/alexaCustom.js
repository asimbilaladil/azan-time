const router = require('express').Router();
const db     = require('../database/mysql');
const { getCurrentPrayer } = require('../services/prayerService');
const { decrypt }          = require('../services/encryption');

const CDN = process.env.CDN_BASE_URL || 'https://cdn.azantime.de';

const AUDIO_URLS = {
  fajr: `${CDN}/fajr.mp3`,
  dhuhr: `${CDN}/dhuhr.mp3`,
  asr: `${CDN}/asr.mp3`,
  maghrib: `${CDN}/maghrib.mp3`,
  isha: `${CDN}/isha.mp3`,
};

router.post('/', async (req, res) => {

  const body = req.body;
  const requestType = body?.request?.type;

  try {

    // 1️⃣ LaunchRequest (routine opens skill)
    if (requestType === "LaunchRequest") {
      return res.json({
        version: "1.0",
        response: {
          directives: [
            {
              type: "AudioPlayer.Play",
              playBehavior: "REPLACE_ALL",
              audioItem: {
                stream: {
                  token: "adhan",
                  url: "https://cdn.azantime.de/fajr.mp3",
                  offsetInMilliseconds: 0
                }
              }
            }
          ],
          shouldEndSession: true
        }
      });
    }

    // 2️⃣ Ignore audio lifecycle events
    if (
      requestType?.startsWith('AudioPlayer.') ||
      requestType?.startsWith('PlaybackController.') ||
      requestType === 'SessionEndedRequest'
    ) {
      return res.json({ version: '1.0', response: {} });
    }

    // 3️⃣ Stop / cancel
    const intentName = body?.request?.intent?.name;
    if (
      intentName === 'AMAZON.StopIntent' ||
      intentName === 'AMAZON.CancelIntent' ||
      intentName === 'AMAZON.PauseIntent'
    ) {
      return res.json({
        version: '1.0',
        response: {
          directives: [{ type: 'AudioPlayer.Stop' }],
          shouldEndSession: true
        }
      });
    }

    // 4️⃣ Account linking
    const accessToken = body?.context?.System?.user?.accessToken;

    if (!accessToken) {
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "Please link your account in the Alexa app to use Azan Time."
          },
          shouldEndSession: true
        }
      });
    }

    const user = await getUserByToken(accessToken);

    if (!user) {
      return res.json({
        version: "1.0",
        response: {
          outputSpeech: {
            type: "PlainText",
            text: "User account not found."
          },
          shouldEndSession: true
        }
      });
    }

    // 5️⃣ Play correct prayer
    const prayer = getCurrentPrayer(
      user.latitude,
      user.longitude,
      user.calculation_method
    );

    const audioUrl = AUDIO_URLS[prayer] || AUDIO_URLS.fajr;

    return res.json({
      version: "1.0",
      response: {
        directives: [
          {
            type: "AudioPlayer.Play",
            playBehavior: "REPLACE_ALL",
            audioItem: {
              stream: {
                token: prayer,
                url: audioUrl,
                offsetInMilliseconds: 0
              }
            }
          }
        ],
        shouldEndSession: true
      }
    });

  } catch (err) {

    console.error("Alexa Custom Skill Error:", err);

    return res.json({
      version: "1.0",
      response: {
        outputSpeech: {
          type: "PlainText",
          text: "Something went wrong."
        },
        shouldEndSession: true
      }
    });

  }

});

async function getUserByToken(accessToken) {

  const [users] = await db.query(`
    SELECT u.id, u.access_token, u.calculation_method, u.city_id,
           COALESCE(u.latitude, c.latitude) AS latitude,
           COALESCE(u.longitude, c.longitude) AS longitude
    FROM users u
    LEFT JOIN cities c ON c.id = u.city_id
    WHERE u.is_active = TRUE
      AND u.access_token IS NOT NULL
  `);

  for (const user of users) {
    try {
      if (decrypt(user.access_token) === accessToken) {
        return user;
      }
    } catch {}
  }

  return null;
}

module.exports = router;
