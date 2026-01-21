const express = require('express');
const session = require("express-session");
require('dotenv').config();

const { mssqlConnect } = require('./config/database');
const corsMiddleware = require('./middleware/corsMiddleware');

// Routes
const testRoutes = require('./routes/testRoutes');
const spRoutes = require('./routes/spRoutes');
const partsRoutes = require('./routes/partsRoutes');
const sponsorsRoutes = require('./routes/sponsorsRoutes');
const teamsRoutes = require('./routes/teamsRoutes');
const authRoutes = require('./routes/authRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');

const app = express();
const PORT = process.env.PORT || 9090;

//  Middleware primero
app.use(corsMiddleware);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session después 
app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60
  }
}));


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

// ─────── API ROUTES (una sola vez) ───────
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/sp', spRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/inventory', inventoryRoutes);

// ─────── INIT SERVER ───────
async function initServer() {
  try {
    await mssqlConnect();

    app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SUCCESS] Servidor escuchando en:`);
    console.log(`  - Local: http://localhost:${PORT}`);
    console.log(`  - Red:   http://${getLocalIP()}:${PORT}`);
  });

  // Agrega esta función para obtener la IP local
  function getLocalIP() {
    const interfaces = require('os').networkInterfaces();
    for (const interfaceName in interfaces) {
      for (const iface of interfaces[interfaceName]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  }

  } catch (error) {
    console.error('!ERROR: Web server could not be initialized:', error.message);
    process.exit(1);
  }
}

initServer();
