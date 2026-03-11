const cron = require('node-cron');
const db   = require('./database/mysql');
const { checkPrayerTimeNow } = require('./services/masjidService');
const { triggerAlexaDevice } = require('./services/alexaTrigger');

let isRunning = false;

async function runScheduler() {
  console.log("⏱ Scheduler tick:", new Date().toISOString());
  if (isRunning) {
    console.warn('⚠️  Scheduler: previous run still in progress, skipping tick');
    return;
  }
  isRunning = true;

  try {
    // Get distinct mosque_guids with active users that have a device linked
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
        SELECT id, device_id, access_token, refresh_token, token_expires_at
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
    isRunning = false;
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
  if (process.env.NODE_ENV === 'development') runScheduler();
}

module.exports = { startScheduler };
