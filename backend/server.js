require('dotenv').config();

// ── Env validation (T14) ────────────────────────────────────────────────────
const REQUIRED_ENV = [
  'DB_USER', 'DB_PASSWORD', 'DB_NAME',
  'JWT_SECRET', 'LWA_CLIENT_ID', 'LWA_CLIENT_SECRET',
  'ENCRYPTION_KEY',
];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

const express  = require('express');
const helmet   = require('helmet');
const cors     = require('cors');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Security headers (T14) ──────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
}));

// ── CORS (T14) ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://azantime.de',
        'https://www.azantime.de',
        /\.amazon\.com$/,
        /\.amazonalexa\.com$/,
      ]
    : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Logging (T14) — mask tokens ─────────────────────────────────────────────
morgan.token('masked-auth', (req) => {
  const auth = req.headers.authorization;
  return auth ? auth.slice(0, 15) + '...[masked]' : '-';
});
app.use(morgan(
  process.env.NODE_ENV === 'production'
    ? ':remote-addr :method :url :status :response-time ms auth::masked-auth'
    : 'dev'
));

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting (T14) ──────────────────────────────────────────────────────
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use('/api/auth/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts' },
}));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/user',         require('./routes/user'));
app.use('/api/mosques', mosquesRouter);
app.use('/api/cities',       require('./routes/cities'));
app.use('/alexa/smart-home', require('./routes/alexaSmartHome'));
app.use('/alexa/custom',     require('./routes/alexaCustom'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date(), env: process.env.NODE_ENV }));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);

  // Start prayer scheduler (T06)
  if (process.env.NODE_ENV !== 'test') {
    const { startScheduler } = require('./scheduler');
    startScheduler();
  }
});

module.exports = app;
