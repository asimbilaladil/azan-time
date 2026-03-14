const router      = require('express').Router();
const db          = require('../database/mysql');
const requireAuth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const tzLookup = require('tz-lookup'); // ADD at top

// GET /api/user/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [[user]] = await db.query(
      `SELECT id, email, mosque_guid, device_id, is_active, created_at
       FROM users WHERE id = ?`,
      [req.user.userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/user/settings
router.put('/settings', requireAuth,
  body('mosque_guid').optional().isUUID().withMessage('mosque_guid must be a valid UUID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { mosque_guid } = req.body;

    let timezone = null;

    if (mosque_guid) {
      try {
        const r = await axios.get(
          `https://time.my-masjid.com/api/TimingsInfoScreen/GetMasjidMultipleTimings?GuidId=${mosque_guid}`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }
        );
        const details = r.data?.model?.masjidDetails || {};
        const city = details.city || '';
        const country = details.country || '';

        if (city) {
          const geo = await axios.get(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', ' + country)}&format=json&limit=1`,
            { headers: { 'User-Agent': 'AzanTime/1.0' }, timeout: 5000 }
          );
          if (geo.data?.[0]) {
            const lat = parseFloat(geo.data[0].lat);
            const lng = parseFloat(geo.data[0].lon);
            timezone = tzLookup(lat, lng);
          }
        }
      } catch (e) {
        console.error('Failed to resolve timezone:', e.message);
      }
    }

    try {
      await db.query(
        `UPDATE users SET mosque_guid = ?, timezone = ?, updated_at = NOW() WHERE id = ?`,
        [mosque_guid || null, timezone, req.user.userId]
      );
      res.json({ success: true, timezone });
    } catch (err) {
      console.error('Settings update error:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

module.exports = router;
