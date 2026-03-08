const router  = require('express').Router();
const crypto  = require('crypto');
const auth    = require('../services/authService');
const requireAuth = require('../middleware/auth');

// GET /api/auth/lwa — initiate OAuth flow
router.get('/lwa', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  // TODO: store state in a signed cookie to verify in callback (CSRF protection)
  res.redirect(auth.getLWAAuthURL(state));
});

// GET /api/auth/callback — Amazon calls this after user logs in
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    console.error('Auth callback error:', error);
    return res.redirect('/?error=auth_failed');
  }

  try {
    const tokens  = await auth.exchangeCodeForTokens(code);
    const profile = await auth.getAmazonProfile(tokens.access_token);
    const { jwtToken } = await auth.upsertUserAndIssueJWT(
      profile.user_id,
      profile.email,
      tokens
    );
    // Redirect to frontend with JWT in query (frontend stores in localStorage)
    res.redirect(`https://azantime.de/connect?token=${jwtToken}`);
  } catch (err) {
    console.error('Auth callback exception:', err.message);
    res.redirect('/?error=auth_failed');
  }
});

// POST /api/auth/refresh — refresh LWA access token
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    await auth.refreshAccessToken(req.user.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
