/**
 * alexaDirectService.js — Direct Echo device control via alexa-remote2
 * 
 * This replaces the DoorbellPress → Routine architecture with a direct
 * command to the Echo device using Amazon's internal API (same API the
 * Alexa app uses). This is fundamentally more reliable because:
 * 
 * - No doorbell event gateway involved
 * - No routine binding that can break
 * - No event tokens that expire
 * - Server directly tells Echo: "open azan time"
 * 
 * Setup (one-time):
 *   1. Start the server with ALEXA_PROXY=true
 *   2. Open http://YOUR_SERVER_IP:3001 in a browser
 *   3. Log in with your Amazon account
 *   4. Cookie is saved automatically to /var/lib/azantime/alexa-cookie.json
 *   5. Restart server normally — it will use the saved cookie
 * 
 * The cookie auto-refreshes. If it ever expires, repeat step 2-4.
 */

const Alexa = require('alexa-remote2');
const fs    = require('fs');
const path  = require('path');

const COOKIE_PATH = process.env.ALEXA_COOKIE_PATH || '/var/lib/azantime/alexa-cookie.json';
const SKILL_INVOCATION = 'öffne azan time'; // German: "open azan time" — adjust for your locale

let alexa = null;
let isInitialized = false;
let initPromise = null;

// ── Load saved cookie data ────────────────────────────────────────────────────
function loadCookieData() {
  try {
    if (fs.existsSync(COOKIE_PATH)) {
      const data = JSON.parse(fs.readFileSync(COOKIE_PATH, 'utf8'));
      console.log('🍪 Loaded saved Alexa cookie data');
      return data;
    }
  } catch (e) {
    console.error('⚠️ Failed to load cookie data:', e.message);
  }
  return null;
}

// ── Save cookie data ──────────────────────────────────────────────────────────
function saveCookieData(cookieData) {
  try {
    const dir = path.dirname(COOKIE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(COOKIE_PATH, JSON.stringify(cookieData, null, 2));
    console.log('🍪 Cookie data saved to', COOKIE_PATH);
  } catch (e) {
    console.error('❌ Failed to save cookie data:', e.message);
  }
}

// ── Initialize alexa-remote2 ─────────────────────────────────────────────────
function initAlexa(proxyMode = false) {
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    alexa = new Alexa();

    alexa.on('cookie', (cookie, csrf, macDms) => {
      // Save full cookie data for next restart
      const cookieData = alexa.cookieData;
      saveCookieData(cookieData);
      console.log('🍪 Cookie refreshed and saved');
    });

    const savedCookie = loadCookieData();

    const options = {
      logger: false, // set to console.log for debugging
      alexaServiceHost: 'layla.amazon.de', // .de for Germany
      amazonPage: 'amazon.de',
      acceptLanguage: 'de-DE',
      useWsMqtt: false, // don't need push notifications
      cookieRefreshInterval: 7 * 24 * 60 * 60 * 1000, // refresh weekly
      usePushConnectType: 3,
    };

    if (proxyMode || !savedCookie) {
      // Proxy mode: opens a web page where user logs in with Amazon
      options.proxyOnly = true;
      options.proxyOwnIp = process.env.ALEXA_PROXY_IP || '89.167.65.137';
      options.proxyPort = parseInt(process.env.ALEXA_PROXY_PORT || '3001');
      options.proxyLogLevel = 'info';
      console.log(`🌐 Alexa proxy starting on port ${options.proxyPort}`);
      console.log(`   Open http://${options.proxyOwnIp}:${options.proxyPort} in browser to log in`);
    } else {
      // Normal mode: use saved cookie
      options.cookie = savedCookie;
      options.formerRegistrationData = savedCookie;
    }

    alexa.init(options, (err) => {
      if (err) {
        console.error('❌ Alexa Remote init failed:', err.message || err);
        isInitialized = false;
        initPromise = null;
        return reject(err);
      }

      isInitialized = true;
      console.log('✅ Alexa Remote connected');

      // List devices
      const devices = Object.keys(alexa.serialNumbers || {});
      console.log(`📱 Found ${devices.length} Alexa devices:`);
      for (const serial of devices) {
        const dev = alexa.find(serial);
        if (dev) {
          console.log(`   - ${dev.accountName} (${dev.deviceFamily}) [${dev.serialNumber}]`);
        }
      }

      resolve(alexa);
    });
  });

  return initPromise;
}

// ── Send "open azan time" to a specific device ───────────────────────────────
function triggerAzan(deviceNameOrSerial, prayer) {
  return new Promise((resolve, reject) => {
    if (!isInitialized || !alexa) {
      return reject(new Error('Alexa Remote not initialized'));
    }

    const device = alexa.find(deviceNameOrSerial);
    if (!device) {
      return reject(new Error(`Device not found: ${deviceNameOrSerial}`));
    }

    console.log(`🕌 Sending "${SKILL_INVOCATION}" to ${device.accountName} for ${prayer}`);

    // textCommand sends it as if the user spoke the words
    alexa.sendSequenceCommand(deviceNameOrSerial, 'textCommand', SKILL_INVOCATION, (err, res) => {
      if (err) {
        console.error(`❌ textCommand failed:`, err.message || err);
        return reject(err);
      }
      console.log(`✅ Azan triggered on ${device.accountName} (${prayer})`);
      resolve(true);
    });
  });
}

// ── Get list of available devices ─────────────────────────────────────────────
function getDevices() {
  if (!isInitialized || !alexa) return [];
  
  return Object.keys(alexa.serialNumbers || {}).map(serial => {
    const dev = alexa.find(serial);
    return {
      name: dev?.accountName || serial,
      serial: dev?.serialNumber,
      family: dev?.deviceFamily,
      type: dev?.deviceType,
      online: dev?.online !== false
    };
  }).filter(d => d.family === 'ECHO' || d.family === 'KNIGHT' || d.family === 'ROOK');
}

// ── Check if initialized ──────────────────────────────────────────────────────
function isReady() {
  return isInitialized && alexa !== null;
}

// ── Shutdown ──────────────────────────────────────────────────────────────────
function shutdown() {
  if (alexa) {
    try { alexa.stop(); } catch (e) {}
    alexa = null;
    isInitialized = false;
    initPromise = null;
  }
}

module.exports = {
  initAlexa,
  triggerAzan,
  getDevices,
  isReady,
  shutdown,
  SKILL_INVOCATION
};
