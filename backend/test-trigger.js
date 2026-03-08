// test-trigger.js — run: node test-trigger.js
// Tests the Alexa device trigger for a real user in DB
require('dotenv').config();
const db = require('./database/mysql');
const { triggerAlexaDevice } = require('./services/alexaTrigger');

async function test() {
  try {
    const [[user]] = await db.query(
      'SELECT * FROM users WHERE device_id IS NOT NULL LIMIT 1'
    );
    if (!user) {
      console.log('⚠️  No user with device_id found. Complete setup first.');
      return;
    }
    console.log(`Testing trigger for user ${user.id} (device: ${user.device_id})...`);
    await triggerAlexaDevice(user, 'fajr');
    console.log('✅ Trigger sent successfully');
  } catch (err) {
    console.error('❌ Trigger failed:', err.message);
  } finally {
    process.exit(0);
  }
}

test();
