const express    = require('express');
const mongoose   = require('mongoose');
const dotenv     = require('dotenv');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');

// Load the REAL routes/index.js which has ALL routes
const routes     = require('./routes/index');

dotenv.config();

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (/\.vercel\.app$/.test(origin)) return callback(null, true);
    if (/^http:\/\/localhost/.test(origin)) return callback(null, true);
    return callback(new Error('CORS: origin not allowed → ' + origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Security & Logging ──────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'Shopifix API is running 🚀' });
});

// ─── ALL Routes mounted here under /api ──────────────────────────────────────
// routes/index.js already defines:
//   /auth/register, /auth/login, /products, /categories,
//   /cart, /orders, /settings, /admin/... etc.
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// ─── Connect DB & Start Server ───────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });