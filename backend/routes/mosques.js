const router = require('express').Router();
const { searchMosques, getMosqueTimes } = require('../services/masjidService');
const auth = require('../middleware/auth');

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

module.exports = router;
