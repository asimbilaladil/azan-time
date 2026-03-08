const adhan = require('adhan');

// Map DB method names → adhan-js CalculationMethod factories
const METHODS = {
  MuslimWorldLeague:    () => adhan.CalculationMethod.MuslimWorldLeague(),
  NorthAmerica:         () => adhan.CalculationMethod.NorthAmerica(),
  ISNA:                 () => adhan.CalculationMethod.NorthAmerica(),
  Egyptian:             () => adhan.CalculationMethod.Egyptian(),
  Karachi:              () => adhan.CalculationMethod.Karachi(),
  UmmAlQura:            () => adhan.CalculationMethod.UmmAlQura(),
  Turkey:               () => adhan.CalculationMethod.Turkey(),
  Tehran:               () => adhan.CalculationMethod.Tehran(),
  Singapore:            () => adhan.CalculationMethod.Singapore(),
  JAKIM:                () => adhan.CalculationMethod.Singapore(),
  Kemenag:              () => adhan.CalculationMethod.Singapore(),
  MoonsightingCommittee:() => adhan.CalculationMethod.MoonsightingCommittee(),
};

/**
 * Get all 5 prayer times + sunrise for a location.
 * @param {number} lat
 * @param {number} lng
 * @param {string} method - calculation method name
 * @param {Date}   date   - defaults to today UTC
 * @returns {{ fajr, sunrise, dhuhr, asr, maghrib, isha }} as Date objects (UTC)
 */
function getPrayerTimes(lat, lng, method = 'MuslimWorldLeague', date = new Date()) {
  const coords = new adhan.Coordinates(parseFloat(lat), parseFloat(lng));
  const params = (METHODS[method] || METHODS.MuslimWorldLeague)();
  const times  = new adhan.PrayerTimes(coords, date, params);

  return {
    fajr:    times.fajr,
    sunrise: times.sunrise,
    dhuhr:   times.dhuhr,
    asr:     times.asr,
    maghrib: times.maghrib,
    isha:    times.isha,
  };
}

/**
 * Get the name of the current prayer based on current time.
 * @returns {string} 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'
 */
function getCurrentPrayer(lat, lng, method = 'MuslimWorldLeague') {
  const coords = new adhan.Coordinates(parseFloat(lat), parseFloat(lng));
  const params = (METHODS[method] || METHODS.MuslimWorldLeague)();
  const times  = new adhan.PrayerTimes(coords, new Date(), params);
  const prayer = times.currentPrayer();
  // If none (before fajr) return isha from yesterday — still play isha
  return (prayer === adhan.Prayer.None || !prayer) ? 'isha' : prayer;
}

/**
 * Check if any prayer time matches the current minute.
 * Returns the prayer name or null.
 * @param {number} lat
 * @param {number} lng
 * @param {string} method
 * @returns {string|null}
 */
function checkPrayerTimeNow(lat, lng, method = 'MuslimWorldLeague') {
  const now    = new Date();
  const nowMin = Math.floor(now.getTime() / 60000);
  const times  = getPrayerTimes(lat, lng, method);
  const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  for (const prayer of prayers) {
    if (!times[prayer]) continue;
    const prayerMin = Math.floor(times[prayer].getTime() / 60000);
    if (prayerMin === nowMin) return prayer;
  }
  return null;
}

module.exports = { getPrayerTimes, getCurrentPrayer, checkPrayerTimeNow };
