const router      = require('express').Router();
const { body, validationResult } = require('express-validator');
const requireAuth = require('../middleware/auth');
const db          = require('../database/mysql');

const VALID_METHODS = [
  'MuslimWorldLeague', 'NorthAmerica', 'ISNA', 'Egyptian',
  'Karachi', 'UmmAlQura', 'Turkey', 'Tehran', 'Singapore',
  'JAKIM', 'Kemenag', 'MoonsightingCommittee',
];

// GET /api/user/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [[user]] = await db.query(
      `SELECT id, email, city_id, timezone, calculation_method, device_id, is_active, created_at
       FROM users WHERE id = ?`,
      [req.user.userId]
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/user/settings (T14: with input validation)
router.put('/settings', requireAuth,
  [
    body('city_id')
      .isInt({ min: 1 })
      .withMessage('city_id must be a positive integer'),
    body('calculation_method')
      .isIn(VALID_METHODS)
      .withMessage(`calculation_method must be one of: ${VALID_METHODS.join(', ')}`),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { city_id, calculation_method } = req.body;

      // Fetch city coords + timezone to denormalize onto user row
      const [[city]] = await db.query(
        'SELECT latitude, longitude, timezone FROM cities WHERE id = ?',
        [city_id]
      );
      if (!city) return res.status(400).json({ error: 'City not found' });

      await db.query(
        `UPDATE users
         SET city_id = ?, calculation_method = ?, latitude = ?, longitude = ?, timezone = ?, updated_at = NOW()
         WHERE id = ?`,
        [city_id, calculation_method, city.latitude, city.longitude, city.timezone, req.user.userId]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
