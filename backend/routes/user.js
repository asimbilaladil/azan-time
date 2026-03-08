const router      = require('express').Router();
const db          = require('../database/mysql');
const requireAuth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

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

    try {
      await db.query(
        `UPDATE users SET mosque_guid = ?, updated_at = NOW() WHERE id = ?`,
        [mosque_guid || null, req.user.userId]
      );
      res.json({ success: true });
    } catch (err) {
      console.error('Settings update error:', err);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
);

module.exports = router;
