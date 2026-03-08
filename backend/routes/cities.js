const router = require('express').Router();
const db     = require('../database/mysql');

// GET /api/cities — returns all cities sorted by name
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, country, latitude, longitude, timezone, calculation_method FROM cities ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('cities route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cities/:id — single city
router.get('/:id', async (req, res) => {
  try {
    const [[city]] = await db.query(
      'SELECT id, name, country, latitude, longitude, timezone, calculation_method FROM cities WHERE id = ?',
      [req.params.id]
    );
    if (!city) return res.status(404).json({ error: 'City not found' });
    res.json(city);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
