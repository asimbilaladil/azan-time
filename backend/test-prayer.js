// test-prayer.js — run: node test-prayer.js
require('dotenv').config();
const { getPrayerTimes, checkPrayerTimeNow } = require('./services/prayerService');

console.log('🕌 Testing prayer engine...\n');

// Berlin — MuslimWorldLeague
const berlin = getPrayerTimes(52.52, 13.40, 'MuslimWorldLeague');
console.log('Berlin prayer times (UTC):');
Object.entries(berlin).forEach(([name, time]) => console.log(`  ${name}: ${time?.toISOString()}`));

// Assertions
console.assert(berlin.fajr < berlin.sunrise, '❌ Fajr must be before sunrise');
console.assert(berlin.dhuhr > berlin.sunrise, '❌ Dhuhr must be after sunrise');
console.assert(berlin.asr > berlin.dhuhr, '❌ Asr must be after Dhuhr');
console.assert(berlin.maghrib > berlin.asr, '❌ Maghrib must be after Asr');
console.assert(berlin.isha > berlin.maghrib, '❌ Isha must be after Maghrib');
console.log('✅ Berlin prayer times order correct\n');

// Karachi method
const karachi = getPrayerTimes(24.86, 67.00, 'Karachi');
console.assert(Object.values(karachi).every(t => t instanceof Date), '❌ All times must be Date objects');
console.log('✅ Karachi method works\n');

// New York — ISNA
const ny = getPrayerTimes(40.71, -74.00, 'ISNA');
console.assert(Object.values(ny).every(t => t instanceof Date), '❌ All ISNA times must be Date objects');
console.log('✅ New York / ISNA method works\n');

console.log('Current prayer check now:', checkPrayerTimeNow(52.52, 13.40, 'MuslimWorldLeague') || 'none');
console.log('✅ All prayer engine tests passed!');
