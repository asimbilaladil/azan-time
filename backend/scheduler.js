const cron = require('node-cron');
const db   = require('./database/mysql');
const { checkPrayerTimeNow, getMosqueTimes } = require('./services/masjidService');
const { triggerAlexaDevice, refreshEventToken } = require('./services/alexaTrigger');

let isRunning = false;

async function runScheduler() {
  console.log("⏱ Scheduler tick:", new Date().toISOString());
  if (isRunning) {
    console.warn('⚠️  Scheduler: previous run still in progress, skipping tick');
    return;
  }
  isRunning = true;

  // Safety: force-release lock after 45 seconds
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
               event_token, event_token_expires, event_refresh_token
        FROM users
        WHERE mosque_guid = ? AND is_active = TRUE AND device_id IS NOT NULL
      `, [mosque_guid]);
      console.log(`👥 Users with device: ${users.length}`);
      console.log(`🕌 ${prayer.toUpperCase()} — mosque ${mosque_guid} (${users.length} users)`);

      const triggers = users.map(user =>
        triggerAlexaDevice(user, prayer)
          .then(() => logTrigger(user.id, prayer, true))
          .catch(err => logTrigger(user.id, prayer, false, err.message))
      );

      await Promise.allSettled(triggers);
    }
  } catch (err) {
    console.error('❌ Scheduler error:', err.message);
  } finally {
    clearTimeout(lockTimeout);
    isRunning = false;
  }
}

async function preWarmTokens() {
  try {
    const [users] = await db.query(`
      SELECT id, event_token, event_token_expires, event_refresh_token,
             device_id, mosque_guid, timezone
      FROM users
      WHERE is_active = TRUE AND device_id IS NOT NULL AND mosque_guid IS NOT NULL
    `);

    for (const user of users) {
      const tz = user.timezone || 'UTC';
      const nowLocal = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
      const nowMin = nowLocal.getHours() * 60 + nowLocal.getMinutes();

      const { times } = await getMosqueTimes(user.mosque_guid);

      for (const prayer of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
        if (!times[prayer]) continue;
        const [h, m] = times[prayer].split(':').map(Number);
        const prayerMin = h * 60 + m;
        const diff = prayerMin - nowMin;

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

async function logTrigger(userId, prayer, success, errorMessage = null) {
  try {
    await db.query(
      'INSERT INTO trigger_log (user_id, prayer, success, error_message) VALUES (?, ?, ?, ?)',
      [userId, prayer, success, errorMessage]
    );
  } catch (e) {
    console.error('Failed to write trigger_log:', e.message);
  }
}

function startScheduler() {
  console.log('⏰ Prayer scheduler started — running every minute');

  cron.schedule('* * * * *', runScheduler);

  // prewarm every 5 minutes
  cron.schedule('*/5 * * * *', preWarmTokens);

  // 🔥 KEEP-ALIVE (ADD THIS)
  cron.schedule('*/25 * * * *', async () => {
    console.log("🔄 Keep-alive ping to Alexa...");

    try {
      const [users] = await db.query(`
        SELECT id, device_id, event_token, event_token_expires, event_refresh_token
        FROM users
        WHERE is_active = TRUE AND device_id IS NOT NULL
      `);

      for (const user of users) {
        try {
          await triggerAlexaDevice(user, "keepalive");
          console.log(`✅ Keep-alive success for user ${user.id}`);
        } catch (err) {
          console.log(`⚠️ Keep-alive failed for user ${user.id}, refreshing token...`);

          try {
            await refreshEventToken(user.id);
            console.log(`🔁 Token refreshed for user ${user.id}`);
          } catch (e) {
            console.error(`❌ Token refresh failed for user ${user.id}:`, e.message);
          }
        }
      }
    } catch (err) {
      console.error("❌ Keep-alive error:", err.message);
    }
  });

  if (process.env.NODE_ENV === 'development') runScheduler();
}

module.exports = { startScheduler };
