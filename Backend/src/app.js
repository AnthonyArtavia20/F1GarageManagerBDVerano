const express = require('express');
const { mssqlConnect } = require('./config/database');
const corsMiddleware = require('./middleware/corsMiddleware');

// Import Routes
const testRoutes = require('./routes/testRoutes');
const spRoutes = require('./routes/spRoutes');
const partsRoutes = require('./routes/partsRoutes');
const sponsorsRoutes = require('./routes/sponsorsRoutes');
const teamsRoutes = require('./routes/teamsRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT;

const session = require("express-session");

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 // 1 hora
  }
}));

// Middleware 
app.use(corsMiddleware);
app.use(express.json());   
app.use(express.urlencoded({ extended: true })); 

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

// API Routes 
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/sp', spRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/teams', teamsRoutes);

// Init Server 
async function initServer() {
  try {
    await mssqlConnect(); 
    
    app.listen(PORT, () => {
      console.log(`[SUCCESS] (◪_◪)- http://localhost:${PORT}`);
      console.log('');
      console.log('Rutas disponibles:');
      console.log('  - GET  /');
      console.log('  - GET  /status');
      console.log('  - POST /api/auth/login');
      console.log('  - GET  /api/teams');
      console.log('  - GET  /api/parts');
      console.log('  - GET  /api/sponsors');
      console.log('  - GET  /api/sp/*');
      console.log('');
    });
  } catch (error) {
    console.error('!ERROR: Web server could not be initialized:', error.message);
    process.exit(1);
  }
}

initServer();