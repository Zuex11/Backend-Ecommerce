const cors = require('cors');
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((string) => string.trim())
  .filter(Boolean);
const corsOptions = {
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    else return cb(new Error('Origin policy: origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = cors(corsOptions);
