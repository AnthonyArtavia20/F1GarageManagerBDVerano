const express = require('express');
const session = require("express-session");
require('dotenv').config();

const { mssqlConnect } = require('./config/database');
const corsMiddleware = require('./middleware/corsMiddleware');

// Routes
const testRoutes = require('./routes/testRoutes');
const spRoutes = require('./routes/spRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 9090;

// ─────── MIDDLEWARES BASE ───────
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,   // solo true con HTTPS
    sameSite: "lax",
    maxAge: 1000 * 60 * 60
  }
}));

// ─────── ROUTES ───────
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/sp', spRoutes);

// ─────── PUBLIC ROUTES ───────
app.get('/', (req, res) => {
  res.json({
    mssg: 'F1 Garage Manager API',
    status: 'Sync with MSSQL-Server',
    data_base: process.env.DB_NAME,
    server: process.env.DB_SERVER
  });
});

app.get('/status', async (req, res) => {
  try {
    const pool = await mssqlConnect();
    const result = await pool.request().query('SELECT @@VERSION as version');

    res.json({
      status: 'online',
      data_base: process.env.DB_NAME,
      version_sql: result.recordset[0].version.split('\n')[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      estado: 'error',
      mensaje: error.message
    });
  }
});

// ─────── INIT SERVER ───────
async function initServer() {
  try {
    await mssqlConnect();

    app.listen(PORT, () => {
      console.log(`[SUCCESS] API running → http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('!ERROR: Web server could not be initialized:', error.message);
    process.exit(1);
  }
}

initServer();
