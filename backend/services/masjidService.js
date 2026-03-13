const axios = require('axios');
const db    = require('../database/mysql');

const BASE = 'https://time.my-masjid.com/api';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map();

async function searchMosques(query) {
  const url = `${BASE}/Masjid/GetAllMasjid?searchKey=${encodeURIComponent(query)}`;
  const { data } = await axios.get(url, { timeout: 8000 });
  const list = data?.model || [];
  return list.map(m => ({
    guid:    m.guidId,
    name:    m.name,
    address: [m.house, m.street, m.city, m.country].filter(Boolean).join(', '),
    city:    m.city,
    country: m.country,
    latitude:  m.latitude,
    longitude: m.longitude,
  }));
}

async function getMosqueTimes(guid) {
  const now = Date.now();
  if (cache.has(guid)) {
    const { ts, data } = cache.get(guid);
    if (now - ts < CACHE_TTL) return data;
  }

  const url = `${BASE}/TimingsInfoScreen/GetMasjidMultipleTimings?GuidId=${guid}`;
  const { data } = await axios.get(url, { timeout: 8000 });

  const today = new Date();
  const day   = today.getDate();
  const month = today.getMonth() + 1;

  const timings = data?.model?.salahTimings || [];
  const entry   = timings.find(t => t.day === day && t.month === month);

  if (!entry) throw new Error(`No timings found for ${day}/${month}`);

  const result = {
    fajr:    entry.fajr?.[0]?.salahTime    || null,
    dhuhr:   entry.zuhr?.[0]?.salahTime    || null,
    asr:     entry.asr?.[0]?.salahTime     || null,
    maghrib: entry.maghrib?.[0]?.salahTime || null,
    isha:    entry.isha?.[0]?.salahTime    || null,
  };

  cache.set(guid, { ts: now, data: result });
  return result;
}

async function checkPrayerTimeNow(guid) {
  try {
    const { times, timezone } = await getMosqueTimesWithTz(guid);
    const now = new Date();

    // Convert server UTC time to mosque local time
    const tz = timezone || 'UTC';
    const nowLocal = new Date(now.toLocaleString('en-US', { timeZone: tz }));
    const nowMin   = nowLocal.getHours() * 60 + nowLocal.getMinutes();

    console.log(`🕐 Local time in ${tz}: ${nowLocal.getHours()}:${String(nowLocal.getMinutes()).padStart(2,'0')} (${nowMin} min)`);

    for (const prayer of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
      if (!times[prayer]) continue;
      const [h, m] = times[prayer].split(':').map(Number);
      const prayerMin = h * 60 + m;
      if (nowMin >= prayerMin && nowMin < prayerMin + 1) {
        console.log(`Prayer matched: ${prayer}`);
        return prayer;
      }
    }
    return null;
  } catch (err) {
    console.error('Prayer check error:', err.message);
    return null;
  }
}

// Get times + resolve timezone from mosque lat/lng
async function getMosqueTimesWithTz(guid) {
  // Try to get timezone from users table first
  const [[user]] = await db.query(
      'SELECT timezone, mosque_guid FROM users WHERE mosque_guid = ? LIMIT 1', [guid]
  );

  let timezone = user?.timezone || null;

  // If no timezone stored, fetch mosque details to get lat/lng
  if (!timezone) {
    try {
      const tzlookup = require('tz-lookup');
      const url = `${BASE}/TimingsInfoScreen/GetMasjidMultipleTimings?GuidId=${guid}`;
      const { data } = await axios.get(url, { timeout: 8000 });
      const lat = data?.model?.masjidDetails?.latitude;
      const lng = data?.model?.masjidDetails?.longitude;
      if (lat && lng) {
        timezone = tzlookup(lat, lng);
        console.log(`📍 Resolved timezone ${timezone} from lat=${lat} lng=${lng}`);
        // Save it for next time
        await db.query('UPDATE users SET timezone = ? WHERE mosque_guid = ?', [timezone, guid]);
      }
    } catch (e) {
      console.error('Timezone lookup failed:', e.message);
    }
  }

  const times = await getMosqueTimes(guid);
  return { times, timezone };
}

module.exports = { searchMosques, getMosqueTimes, checkPrayerTimeNow };