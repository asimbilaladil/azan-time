// test-all.js — run: npm test
// Runs all non-network tests (prayer engine, encryption, validators)
require('dotenv').config();

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { console.log(`  ✅ ${msg}`); passed++; }
  else           { console.error(`  ❌ ${msg}`); failed++; }
}

// ── Prayer Engine ─────────────────────────────────────────────────────────────
console.log('\n📿 Prayer Engine tests:');
const { getPrayerTimes, checkPrayerTimeNow } = require('./services/prayerService');

const berlin = getPrayerTimes(52.52, 13.40, 'MuslimWorldLeague');
assert(berlin.fajr instanceof Date,    'fajr is a Date');
assert(berlin.fajr    < berlin.sunrise,'fajr before sunrise');
assert(berlin.dhuhr   > berlin.sunrise,'dhuhr after sunrise');
assert(berlin.asr     > berlin.dhuhr,  'asr after dhuhr');
assert(berlin.maghrib > berlin.asr,    'maghrib after asr');
assert(berlin.isha    > berlin.maghrib,'isha after maghrib');

const karachi = getPrayerTimes(24.86, 67.00, 'Karachi');
assert(Object.values(karachi).every(t => t instanceof Date), 'Karachi: all dates valid');

const ny = getPrayerTimes(40.71, -74.00, 'ISNA');
assert(Object.values(ny).every(t => t instanceof Date), 'ISNA / New York: all dates valid');

const result = checkPrayerTimeNow(52.52, 13.40, 'MuslimWorldLeague');
assert(result === null || typeof result === 'string', 'checkPrayerTimeNow returns string or null');

// ── Encryption ────────────────────────────────────────────────────────────────
console.log('\n🔐 Encryption tests:');
// Use a test key for encryption tests
process.env.ENCRYPTION_KEY = 'a'.repeat(64);
const { encrypt, decrypt } = require('./services/encryption');

const original = 'test-access-token-abc123';
const enc = encrypt(original);
assert(enc !== original,          'encrypted text differs from original');
assert(enc.split(':').length === 3,'encrypted has 3 parts (iv:tag:data)');
const dec = decrypt(enc);
assert(dec === original,          'decrypted matches original');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
