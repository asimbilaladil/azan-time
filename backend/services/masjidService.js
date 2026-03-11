const axios = require('axios');

const BASE = 'https://time.my-masjid.com/api';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; AzanTime/1.0)', 'Accept': 'application/json' };

/**
 * Search mosques by name/city via my-masjid.com
 */
async function searchMosques(query) {
  const url = `${BASE}/Masjid/GetPublicFilteredMasjid?searchParam=${encodeURIComponent(query)}&isPublished=1`;
  const r   = await axios.get(url, { headers: HEADERS, timeout: 8000 });
  const list = r.data?.model?.masjidList || r.data?.data || [];
  return list.map(m => ({
    guid:    m.guidId    || m.GuidId,
    name:    m.name      || m.MasjidName,
    city:    m.cityId    || m.City    || m.city    || '',
    country: m.countryId || m.Country || m.country || '',
  })).filter(m => m.guid && m.name);
}

/**
 * Fetch today's prayer times for a mosque guid.
 * The API returns the FULL YEAR in model.salahTimings[].
 * Each entry has { day, month, fajr:[{salahTime}], zuhr:[{salahTime}], asr, maghrib, isha }
 * We match by day + month to find today's entry.
 *
 * Uses DB cache — only fetches from API if today's record is missing.
 */
async function getMosqueTimes(guid) {
  const db    = require('../database/mysql');
  const now   = new Date();
  const day   = now.getDate();        // e.g. 8
  const month = now.getMonth() + 1;  // e.g. 3

  // Check DB cache for today
  const [rows] = await db.query(
    'SELECT * FROM mosques WHERE guid = ? AND MONTH(times_date) = ? AND DAY(times_date) = ? AND YEAR(times_date) = YEAR(CURDATE())',
    [guid, month, day]
  );

  if (rows.length > 0) {
    const m = rows[0];
    return {
      mosque: { guid: m.guid, name: m.name, city: m.city, country: m.country },
      times:  { fajr: m.fajr, dhuhr: m.dhuhr, asr: m.asr, maghrib: m.maghrib, isha: m.isha },
    };
  }

  // Fetch full year from API
  const url  = `${BASE}/TimingsInfoScreen/GetMasjidMultipleTimings?GuidId=${guid}`;
  const r    = await axios.get(url, { headers: HEADERS, timeout: 10000 });
  const model = r.data?.model;
  if (!model) throw new Error('Unexpected API response structure');

  const details  = model.masjidDetails || {};
  const name     = details.name    || 'Mosque';
  const city     = details.city    || '';
  const country  = details.country || '';

  // Find today's entry: match day + month
  const salahTimings = model.salahTimings || [];
  const todayEntry   = salahTimings.find(e => e.day === day && e.month === month);
  if (!todayEntry) throw new Error(`No timing found for day=${day} month=${month}`);

  // Each prayer key is an array — grab [0].salahTime
  // NB: the API uses "zuhr" for Dhuhr
  const times = {
    fajr:    todayEntry.fajr?.[0]?.salahTime    || null,
    dhuhr:   todayEntry.zuhr?.[0]?.salahTime    || null,   // API key is "zuhr"
    asr:     todayEntry.asr?.[0]?.salahTime     || null,
    maghrib: todayEntry.maghrib?.[0]?.salahTime || null,
    isha:    todayEntry.isha?.[0]?.salahTime    || null,
  };

  // Upsert today's cache row
  const todayDate = `${now.getFullYear()}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  await db.query(`
    INSERT INTO mosques (guid, name, city, country, fajr, dhuhr, asr, maghrib, isha, times_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name=VALUES(name), city=VALUES(city), country=VALUES(country),
      fajr=VALUES(fajr), dhuhr=VALUES(dhuhr), asr=VALUES(asr),
      maghrib=VALUES(maghrib), isha=VALUES(isha), times_date=VALUES(times_date),
      updated_at=NOW()
  `, [guid, name, city, country, times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha, todayDate]);

  console.log(`✅ Fetched ${name} (${city}) for ${day}/${month}: Fajr=${times.fajr} Zuhr=${times.dhuhr} Asr=${times.asr} Maghrib=${times.maghrib} Isha=${times.isha}`);

  return { mosque: { guid, name, city, country }, times };
}

/**
 * For the scheduler: check if current HH:MM matches any prayer time for a mosque.
 * Returns prayer name (fajr/dhuhr/asr/maghrib/isha) or null.
 */
async function checkPrayerTimeNow(guid) {
  try {
    const { times } = await getMosqueTimes(guid);
    const now    = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

const axios = require('axios');
const db    = require('../database/mysql');

const BASE = 'https://time.my-masjid.com/api';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; AzanTime/1.0)', 'Accept': 'application/json' };

/**
 * Search mosques by name/city via my-masjid.com
 */
async function searchMosques(query) {
  const url = `${BASE}/Masjid/GetPublicFilteredMasjid?searchParam=${encodeURIComponent(query)}&isPublished=1`;
  const r   = await axios.get(url, { headers: HEADERS, timeout: 8000 });
  const list = r.data?.model?.masjidList || r.data?.data || [];
  return list.map(m => ({
    guid:    m.guidId    || m.GuidId,
    name:    m.name      || m.MasjidName,
    city:    m.cityId    || m.City    || m.city    || '',
    country: m.countryId || m.Country || m.country || '',
  })).filter(m => m.guid && m.name);
}

/**
 * Fetch today's prayer times for a mosque guid.
 * The API returns the FULL YEAR in model.salahTimings[].
 * Each entry has { day, month, fajr:[{salahTime}], zuhr:[{salahTime}], asr, maghrib, isha }
 * We match by day + month to find today's entry.
 *
 * Uses DB cache — only fetches from API if today's record is missing.
 */
async function getMosqueTimes(guid) {
  const now   = new Date();
  const day   = now.getDate();        // e.g. 8
  const month = now.getMonth() + 1;  // e.g. 3

  // Check DB cache for today
  const [rows] = await db.query(
    'SELECT * FROM mosques WHERE guid = ? AND MONTH(times_date) = ? AND DAY(times_date) = ? AND YEAR(times_date) = YEAR(CURDATE())',
    [guid, month, day]
  );

  if (rows.length > 0) {
    const m = rows[0];
    return {
      mosque: { guid: m.guid, name: m.name, city: m.city, country: m.country },
      times:  { fajr: m.fajr, dhuhr: m.dhuhr, asr: m.asr, maghrib: m.maghrib, isha: m.isha },
    };
  }

  // Fetch full year from API
  const url  = `${BASE}/TimingsInfoScreen/GetMasjidMultipleTimings?GuidId=${guid}`;
  const r    = await axios.get(url, { headers: HEADERS, timeout: 10000 });
  const model = r.data?.model;
  if (!model) throw new Error('Unexpected API response structure');

  const details  = model.masjidDetails || {};
  const name     = details.name    || 'Mosque';
  const city     = details.city    || '';
  const country  = details.country || '';

  // Find today's entry: match day + month
  const salahTimings = model.salahTimings || [];
  const todayEntry   = salahTimings.find(e => e.day === day && e.month === month);
  if (!todayEntry) throw new Error(`No timing found for day=${day} month=${month}`);

  // Each prayer key is an array — grab [0].salahTime
  // NB: the API uses "zuhr" for Dhuhr
  const times = {
    fajr:    todayEntry.fajr?.[0]?.salahTime    || null,
    dhuhr:   todayEntry.zuhr?.[0]?.salahTime    || null,   // API key is "zuhr"
    asr:     todayEntry.asr?.[0]?.salahTime     || null,
    maghrib: todayEntry.maghrib?.[0]?.salahTime || null,
    isha:    todayEntry.isha?.[0]?.salahTime    || null,
  };

  // Upsert today's cache row
  const todayDate = `${now.getFullYear()}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  await db.query(`
    INSERT INTO mosques (guid, name, city, country, fajr, dhuhr, asr, maghrib, isha, times_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name=VALUES(name), city=VALUES(city), country=VALUES(country),
      fajr=VALUES(fajr), dhuhr=VALUES(dhuhr), asr=VALUES(asr),
      maghrib=VALUES(maghrib), isha=VALUES(isha), times_date=VALUES(times_date),
      updated_at=NOW()
  `, [guid, name, city, country, times.fajr, times.dhuhr, times.asr, times.maghrib, times.isha, todayDate]);

  console.log(`✅ Fetched ${name} (${city}) for ${day}/${month}: Fajr=${times.fajr} Zuhr=${times.dhuhr} Asr=${times.asr} Maghrib=${times.maghrib} Isha=${times.isha}`);

  return { mosque: { guid, name, city, country }, times };
}

/**
 * For the scheduler: check if current HH:MM matches any prayer time for a mosque.
 * Returns prayer name (fajr/dhuhr/asr/maghrib/isha) or null.
 */
async function checkPrayerTimeNow(guid) {
  try {
    const { times } = await getMosqueTimes(guid);
    const now    = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const prayer of ['fajr','dhuhr','asr','maghrib','isha']) {

      if (!times[prayer]) continue;

      const [h, m] = times[prayer].split(':').map(Number);
      const prayerMin = h * 60 + m;

      if (nowMin >= prayerMin && nowMin < prayerMin + 1) {
        console.log(`🕌 Prayer time matched: ${prayer}`);
        return prayer;
      }
    }
    return null;
  } catch (err) {
    console.error(`masjidService.checkPrayerTimeNow error for ${guid}:`, err.message);
    return null;
  }
}

module.exports = { searchMosques, getMosqueTimes, checkPrayerTimeNow };

    return null;
  } catch (err) {
    console.error(`masjidService.checkPrayerTimeNow error for ${guid}:`, err.message);
    return null;
  }
}

module.exports = { searchMosques, getMosqueTimes, checkPrayerTimeNow };
