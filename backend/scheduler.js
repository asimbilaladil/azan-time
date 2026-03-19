const cron = require('node-cron');
const db   = require('./database/mysql');
const { checkPrayerTimeNow, getMosqueTimes } = require('./services/masjidService');
const { triggerAzan, isReady } = require('./services/alexaDirectService');

// Keep old trigger as fallback
const { triggerAlexaDevice, refreshEventToken } = require('./services/alexaTrigger');

let isRunning = false;

// ── Prayer scheduler — runs every minute ─────────────────────────────────────
async function runScheduler() {
  console.log("⏱ Scheduler tick:", new Date().toISOString());
  if (isRunning) {
    console.warn('⚠️  Scheduler: previous run still in progress, skipping tick');
    return;
  }
  isRunning = true;

  const lockTimeout = setTimeout(() => {
    console.error('❌ Scheduler lock timeout — force releasing');
    isRunning = false;
  }, 45000);

  try {
    const [mosques] = await db.query(`
      SELECT DISTINCT mosque_guid
      FROM users
      WHERE is_active = TRUE
        AND device_id IS NOT NULL
        AND mosque_guid IS NOT NULL
    `);

    console.log("📍 Mosques found:", mosques.length);

    for (const { mosque_guid } of mosques) {
      console.log("🔍 Checking mosque:", mosque_guid);
      const prayer = await checkPrayerTimeNow(mosque_guid);
      console.log("🧭 Prayer check result:", prayer);
      if (!prayer) continue;

      const [users] = await db.query(`
        SELECT id, device_id, access_token, refresh_token, token_expires_at,
               event_token, event_token_expires, event_refresh_token,
               alexa_device_serial
        FROM users
        WHERE mosque_guid = ? AND is_active = TRUE AND device_id IS NOT NULL
      `, [mosque_guid]);

      console.log(`👥 Users with device: ${users.length}`);
      console.log(`🕌 ${prayer.toUpperCase()} — mosque ${mosque_guid} (${users.length} users)`);

      for (const user of users) {
        try {
          // PRIMARY: Use alexa-remote2 direct command
          if (isReady() && user.alexa_device_serial) {
            await triggerAzan(user.alexa_device_serial, prayer);
            await logTrigger(user.id, prayer, true, null, 'direct');
            console.log(`✅ Direct trigger success for user ${user.id}`);
          }
          // FALLBACK: Use old DoorbellPress method
          else {
            console.log(`⚠️ Alexa Remote not ready or no device serial — falling back to DoorbellPress`);
            await triggerAlexaDevice(user, prayer);
            await logTrigger(user.id, prayer, true, null, 'doorbell');
          }
        } catch (err) {
          console.error(`❌ Trigger failed for user ${user.id}:`, err.message);
          await logTrigger(user.id, prayer, false, err.message);

          // If direct method failed, try doorbell as fallback
          if (isReady() && user.alexa_device_serial) {
            try {
              console.log(`🔄 Trying DoorbellPress fallback for user ${user.id}...`);
              await triggerAlexaDevice(user, prayer);
              await logTrigger(user.id, prayer, true, null, 'doorbell-fallback');
            } catch (fallbackErr) {
              console.error(`❌ Fallback also failed for user ${user.id}:`, fallbackErr.message);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Scheduler error:', err.message);
  } finally {
    clearTimeout(lockTimeout);
    isRunning = false;
  }
}

// ── Pre-warm tokens (for DoorbellPress fallback) ──────────────────────────────
async function preWarmTokens() {
  try {
    const [users] = await db.query(`
      SELECT id, event_token, event_token_expires, event_refresh_token,
             device_id, mosque_guid, timezone
      FROM users
      WHERE is_active = TRUE AND device_id IS NOT NULL AND mosque_guid IS NOT NULL
    `);

    for (const user of users) {
      const tz       = user.timezone || 'UTC';
      const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
      const nowMin   = nowLocal.getHours() * 60 + nowLocal.getMinutes();

      const { times } = await getMosqueTimes(user.mosque_guid);

      for (const prayer of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
        if (!times[prayer]) continue;
        const [h, m]    = times[prayer].split(':').map(Number);
        const prayerMin = h * 60 + m;
        const diff      = prayerMin - nowMin;

        if (diff >= 28 && diff <= 32) {
          console.log(`🔥 Pre-warming token for ${prayer} in ${diff}min (user ${user.id})`);
          try {
            await refreshEventToken(user.id);
            console.log(`✅ Token pre-warmed for ${prayer}`);
          } catch (e) {
            console.error(`❌ Pre-warm failed for user ${user.id}:`, e.message);
          }
        }
      }
    }
  } catch (err) {
    console.error('❌ Pre-warm error:', err.message);
  }
}

// ── Proactive token refresh (for DoorbellPress fallback) ─────────────────────
async function proactiveTokenRefresh() {
  try {
    const [users] = await db.query(`
      SELECT id FROM users
      WHERE is_active = TRUE AND device_id IS NOT NULL
    `);

    for (const user of users) {
      try {
        await refreshEventToken(user.id);
        console.log(`✅ Proactive token refresh for user ${user.id}`);
      } catch (e) {
        console.error(`❌ Proactive refresh failed for user ${user.id}:`, e.message);
      }
    }
  } catch (err) {
    console.error('❌ Proactive refresh cron error:', err.message);
  }
}

// ── Trigger log ───────────────────────────────────────────────────────────────
async function logTrigger(userId, prayer, success, errorMessage = null, method = 'unknown') {
  try {
    await db.query(
      'INSERT INTO trigger_log (user_id, prayer, success, error_message) VALUES (?, ?, ?, ?)',
      [userId, prayer, success, errorMessage ? `[${method}] ${errorMessage}` : `[${method}] ok`]
    );
  } catch (e) {
    console.error('Failed to write trigger_log:', e.message);
  }
}

// ── Start all cron jobs ───────────────────────────────────────────────────────
function startScheduler() {
  console.log('⏰ Prayer scheduler started — running every minute');

  cron.schedule('* * * * *', runScheduler);
  cron.schedule('*/5 * * * *', preWarmTokens);
  cron.schedule('*/55 * * * *', proactiveTokenRefresh);

  if (process.env.NODE_ENV === 'development') runScheduler();
}

module.exports = { startScheduler };
