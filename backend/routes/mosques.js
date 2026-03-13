const router = require('express').Router();
const { searchMosques, getMosqueTimes } = require('../services/masjidService');
const auth = require('../middleware/auth');
const db   = require('../database/mysql');

// GET /api/mosques/search?q=berlin
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  try {
    const results = await searchMosques(q);
    res.json(results);
  } catch (err) {
    console.error('Mosque search error:', err.message);
    res.status(502).json({ error: 'Failed to search mosques' });
  }
});

// GET /api/mosques/:guid/times
router.get('/:guid/times', auth, async (req, res) => {
  const { guid } = req.params;
  if (!guid || !/^[0-9a-f-]{36}$/i.test(guid)) {
    return res.status(400).json({ error: 'Invalid mosque guid' });
  }
  try {
    const data = await getMosqueTimes(guid);
    res.json(data);
  } catch (err) {
    console.error('Mosque times error:', err.message);
    res.status(502).json({ error: 'Failed to fetch mosque times' });
  }
});

// POST /api/mosques/select  — saves mosque + resolves timezone from lat/lng
router.post('/select', auth, async (req, res) => {
  const { guid, latitude, longitude } = req.body;
  if (!guid) return res.status(400).json({ error: 'guid required' });

  try {
    let timezone = null;
    if (latitude && longitude) {
      try {
        const tzlookup = require('tz-lookup');
        timezone = tzlookup(parseFloat(latitude), parseFloat(longitude));
        console.log(`📍 Timezone resolved: ${timezone} for lat=${latitude} lng=${longitude}`);
      } catch (e) {
        console.error('tz-lookup failed:', e.message);
      }
    }

    await db.query(
        'UPDATE users SET mosque_guid = ?, timezone = ? WHERE id = ?',
        [guid, timezone, req.user.id]
    );

    res.json({ success: true, mosque_guid: guid, timezone });
  } catch (err) {
    console.error('Mosque select error:', err.message);
    res.status(500).json({ error: 'Failed to save mosque' });
  }
});

module.exports = router;