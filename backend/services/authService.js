const axios  = require('axios');
const jwt    = require('jsonwebtoken');
const db     = require('../database/mysql');
const { encrypt, decrypt } = require('./encryption');

const LWA_TOKEN_URL   = 'https://api.amazon.com/auth/o2/token';
const LWA_PROFILE_URL = 'https://api.amazon.com/user/profile';

// ── Step 1: Build redirect URL ────────────────────────────────────────────────
function getLWAAuthURL(state) {
  const params = new URLSearchParams({
    client_id:     process.env.LWA_CLIENT_ID,
    scope:         'profile',
    response_type: 'code',
    redirect_uri:  process.env.LWA_REDIRECT_URI,
    state,
  });
  return `https://www.amazon.com/ap/oa?${params}`;
}

// ── Step 2: Exchange auth code for tokens ─────────────────────────────────────
async function exchangeCodeForTokens(code) {
  const { data } = await axios.post(LWA_TOKEN_URL,
    new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      redirect_uri:  process.env.LWA_REDIRECT_URI,
      client_id:     process.env.LWA_CLIENT_ID,
      client_secret: process.env.LWA_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return data; // { access_token, refresh_token, expires_in, token_type }
}

// ── Step 3: Get Amazon user profile ──────────────────────────────────────────
async function getAmazonProfile(accessToken) {
  const { data } = await axios.get(LWA_PROFILE_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data; // { user_id, email, name }
}

// ── Step 4: Upsert user + issue JWT ──────────────────────────────────────────
async function upsertUserAndIssueJWT(amazonUserId, email, tokens) {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const [result] = await db.query(`
    INSERT INTO users (amazon_user_id, email, access_token, refresh_token, token_expires_at)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      email            = VALUES(email),
      access_token     = VALUES(access_token),
      refresh_token    = VALUES(refresh_token),
      token_expires_at = VALUES(token_expires_at),
      updated_at       = NOW()
  `, [
    amazonUserId,
    email,
    encrypt(tokens.access_token),
    encrypt(tokens.refresh_token),
    expiresAt,
  ]);

  let userId = result.insertId;
  if (!userId) {
    const [[row]] = await db.query('SELECT id FROM users WHERE amazon_user_id = ?', [amazonUserId]);
    userId = row.id;
  }

  const jwtToken = jwt.sign(
    { userId, amazonUserId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  return { userId, jwtToken };
}

// ── Refresh expired LWA access token ─────────────────────────────────────────
async function refreshAccessToken(userId) {
  const [[user]] = await db.query('SELECT refresh_token FROM users WHERE id = ?', [userId]);
  if (!user) throw new Error('User not found');

  const refreshToken = decrypt(user.refresh_token);

  const { data } = await axios.post(LWA_TOKEN_URL,
    new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: refreshToken,
      client_id:     process.env.LWA_CLIENT_ID,
      client_secret: process.env.LWA_CLIENT_SECRET,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);
  await db.query(
    'UPDATE users SET access_token = ?, token_expires_at = ? WHERE id = ?',
    [encrypt(data.access_token), expiresAt, userId]
  );

  return data.access_token;
}

module.exports = { getLWAAuthURL, exchangeCodeForTokens, getAmazonProfile, upsertUserAndIssueJWT, refreshAccessToken };
