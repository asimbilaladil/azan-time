const router = require('express').Router();
const db     = require('../database/mysql');
const { getCurrentPrayer } = require('../services/prayerService');
const { decrypt }          = require('../services/encryption');

const CDN = process.env.CDN_BASE_URL || 'https://cdn.azantime.de';

const AUDIO_URLS = {
  fajr:    `${CDN}/fajr.mp3`,
  dhuhr:   `${CDN}/dhuhr.mp3`,
  asr:     `${CDN}/asr.mp3`,
  maghrib: `${CDN}/maghrib.mp3`,
  isha:    `${CDN}/isha.mp3`,
};

const PRAYER_NAMES = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha',
};

/**
 * POST /alexa/custom
 * Handles all Alexa Custom Skill requests.
 */
router.post('/', async (req, res) => {
  const body        = req.body;
  const requestType = body?.request?.type;

  try {
    // AudioPlayer lifecycle events — acknowledge silently
    if (requestType?.startsWith('AudioPlayer.') ||
        requestType?.startsWith('PlaybackController.') ||
        requestType === 'SessionEndedRequest') {
      return res.json({ version: '1.0', response: {} });
    }

    // Handle AMAZON built-in intents
    const intentName = body?.request?.intent?.name;
    if (intentName === 'AMAZON.StopIntent'   ||
        intentName === 'AMAZON.CancelIntent' ||
        intentName === 'AMAZON.PauseIntent') {
      return res.json(buildStopResponse());
    }

    // All other requests — check account linking
    const accessToken = body?.context?.System?.user?.accessToken;
    if (!accessToken) {
      return res.json(buildSpeakResponse(
        'Please link your Amazon account in the Alexa app to use Azan Time.'
      ));
    }

    const user = await getUserByToken(accessToken);
    if (!user) {
      return res.json(buildSpeakResponse(
        'Your account was not found. Please visit azantime dot com to complete your setup.'
      ));
    }

    if (!user.latitude || !user.city_id) {
      return res.json(buildSpeakResponse(
        'Please select your city at azantime dot com to get started.'
      ));
    }

    // Determine current prayer and stream audio
    const prayer     = getCurrentPrayer(user.latitude, user.longitude, user.calculation_method);
    const audioUrl   = AUDIO_URLS[prayer] || AUDIO_URLS.fajr;
    const prayerName = PRAYER_NAMES[prayer] || prayer;
    const token      = `${prayer}-${user.id}-${Date.now()}`;

    return res.json({
      version: '1.0',
      response: {
        directives: [{
          type:          'AudioPlayer.Play',
          playBehavior:  'REPLACE_ALL',
          audioItem: {
            stream: {
              token,
              url: audioUrl,
              offsetInMilliseconds: 0,
            },
            metadata: {
              title:    `${prayerName} Adhan`,
              subtitle: 'Azan Time',
            },
          },
        }],
        shouldEndSession: true,
      },
    });

  } catch (err) {
    console.error('Custom Skill error:', err.message);
    return res.json(buildSpeakResponse('Sorry, something went wrong. Please try again.'));
  }
});

// Find user by matching their decrypted LWA access token
async function getUserByToken(accessToken) {
  const [users] = await db.query(`
    SELECT u.id, u.access_token, u.calculation_method, u.city_id,
           COALESCE(u.latitude,  c.latitude)  AS latitude,
           COALESCE(u.longitude, c.longitude) AS longitude
    FROM users u
    LEFT JOIN cities c ON c.id = u.city_id
    WHERE u.is_active = TRUE AND u.access_token IS NOT NULL
  `);

  for (const user of users) {
    try {
      if (decrypt(user.access_token) === accessToken) return user;
    } catch {}
  }
  return null;
}

function buildSpeakResponse(text) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "SSML",
        ssml: `<speak>
          <audio src="https://cdn.azantime.de/fajr.mp3"/>
        </speak>`
      },
      shouldEndSession: true
    }
  };
}

function buildStopResponse() {
  return {
    version: '1.0',
    response: {
      directives: [{ type: 'AudioPlayer.Stop' }],
      shouldEndSession: true,
    },
  };
}

module.exports = router;
