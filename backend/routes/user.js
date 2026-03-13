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
    body('mosque_lat').optional().isFloat(),
    body('mosque_lng').optional().isFloat(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { mosque_guid, mosque_lat, mosque_lng } = req.body;

        let timezone = null;
        if (mosque_lat != null && mosque_lng != null) {
            try { timezone = tzLookup(mosque_lat, mosque_lng); } catch (e) {
                console.error('tz-lookup failed:', e.message);
            }
        }

        try {
            await db.query(
                `UPDATE users SET mosque_guid = ?, mosque_lat = ?, mosque_lng = ?, timezone = ?, updated_at = NOW() WHERE id = ?`,
                [mosque_guid || null, mosque_lat || null, mosque_lng || null, timezone, req.user.userId]
            );
            res.json({ success: true, timezone });
        } catch (err) {
            console.error('Settings update error:', err);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    }
);

module.exports = router;
