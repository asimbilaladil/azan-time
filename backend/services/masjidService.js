const axios = require('axios');
const db = require('../database/mysql');

const BASE = 'https://time.my-masjid.com/api';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; AzanTime/1.0)',
  'Accept': 'application/json'
};

async function searchMosques(query) {
  const url = `${BASE}/Masjid/GetPublicFilteredMasjid?searchParam=${encodeURIComponent(query)}&isPublished=1`;

  const r = await axios.get(url, { headers: HEADERS, timeout: 8000 });

  const list = r.data?.model?.masjidList || r.data?.data || [];

  return list.map(m => ({
    guid: m.guidId || m.GuidId,
    name: m.name || m.MasjidName,
    city: m.cityId || m.City || '',
    country: m.countryId || m.Country || ''
  })).filter(m => m.guid && m.name);
}

async function getMosqueTimes(guid) {

  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;

  const [rows] = await db.query(
    `SELECT * FROM mosques
     WHERE guid = ?
     AND MONTH(times_date) = ?
     AND DAY(times_date) = ?
     AND YEAR(times_date) = YEAR(CURDATE())`,
    [guid, month, day]
  );

  if (rows.length > 0) {

    const m = rows[0];

    return {
      mosque: {
        guid: m.guid,
        name: m.name,
        city: m.city,
        country: m.country
      },
      times: {
        fajr: m.fajr,
        dhuhr: m.dhuhr,
        asr: m.asr,
        maghrib: m.maghrib,
        isha: m.isha
      }
    };
  }

  const url = `${BASE}/TimingsInfoScreen/GetMasjidMultipleTimings?GuidId=${guid}`;

  const r = await axios.get(url, { headers: HEADERS, timeout: 10000 });

  const model = r.data?.model;

  if (!model) throw new Error('Invalid API response');

  const details = model.masjidDetails || {};

  const name = details.name || 'Mosque';
  const city = details.city || '';
  const country = details.country || '';

  const salahTimings = model.salahTimings || [];

  const todayEntry = salahTimings.find(e =>
    e.day === day && e.month === month
  );

  if (!todayEntry) throw new Error('No timing found');

  const times = {
    fajr: todayEntry.fajr?.[0]?.salahTime || null,
    dhuhr: todayEntry.zuhr?.[0]?.salahTime || null,
    asr: todayEntry.asr?.[0]?.salahTime || null,
    maghrib: todayEntry.maghrib?.[0]?.salahTime || null,
    isha: todayEntry.isha?.[0]?.salahTime || null
  };

  const todayDate =
    `${now.getFullYear()}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  await db.query(`
    INSERT INTO mosques
    (guid,name,city,country,fajr,dhuhr,asr,maghrib,isha,times_date)
    VALUES (?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
    name=VALUES(name),
    city=VALUES(city),
    country=VALUES(country),
    fajr=VALUES(fajr),
    dhuhr=VALUES(dhuhr),
    asr=VALUES(asr),
    maghrib=VALUES(maghrib),
    isha=VALUES(isha),
    times_date=VALUES(times_date),
    updated_at=NOW()
  `, [
    guid,
    name,
    city,
    country,
    times.fajr,
    times.dhuhr,
    times.asr,
    times.maghrib,
    times.isha,
    todayDate
  ]);

  console.log(
    `Fetched ${name} (${city})`,
    times
  );

  return {
    mosque: { guid, name, city, country },
    times
  };
}

async function checkPrayerTimeNow(guid) {

  try {

    const { times } = await getMosqueTimes(guid);

    const now = new Date();

    const nowMin = now.getHours() * 60 + now.getMinutes();

    for (const prayer of ['fajr','dhuhr','asr','maghrib','isha']) {

      if (!times[prayer]) continue;

      const [h,m] = times[prayer].split(':').map(Number);

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

module.exports = {
  searchMosques,
  getMosqueTimes,
  checkPrayerTimeNow
};
