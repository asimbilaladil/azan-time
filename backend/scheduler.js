const cron = require('node-cron');
const db   = require('./database/mysql');
const { checkPrayerTimeNow } = require('./services/prayerService');
const { triggerAlexaDevice } = require('./services/alexaTrigger');

let isRunning = false;

async function runScheduler() {
  if (isRunning) {
    console.warn('⚠️  Scheduler: previous run still in progress, skipping tick');
    return;
  }
  isRunning = true;

  try {
    // Fetch all distinct cities that have active users with a device linked
    const [cities] = await db.query(`
      SELECT DISTINCT c.id, c.latitude, c.longitude, c.timezone, c.calculation_method
      FROM cities c
      INNER JOIN users u ON u.city_id = c.id
      WHERE u.is_active = TRUE AND u.device_id IS NOT NULL
    `);

    for (const city of cities) {
      const prayer = checkPrayerTimeNow(
        city.latitude,
        city.longitude,
        city.calculation_method
      );

      if (!prayer) continue;

      // Fetch all active users in this city
      const [users] = await db.query(`
        SELECT id, device_id, access_token, refresh_token, token_expires_at
        FROM users
        WHERE city_id = ? AND is_active = TRUE AND device_id IS NOT NULL
      `, [city.id]);

      console.log(`🕌 Prayer time: ${prayer.toUpperCase()} for city ${city.id} (${users.length} users)`);

      // Trigger in parallel, log each result
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

  // Run immediately in dev mode for easy testing
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Dev: running scheduler immediately for testing');
    runScheduler();
  }
}

module.exports = { startScheduler };
