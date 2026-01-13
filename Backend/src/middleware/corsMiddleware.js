const cors = require('cors');

// CORS environment variables config
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
