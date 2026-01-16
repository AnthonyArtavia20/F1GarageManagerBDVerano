const express = require('express');
const { mssqlConnect } = require('./config/database');
const corsMiddleware = require('./middleware/corsMiddleware');

// Import Routes
const testRoutes = require('./routes/testRoutes');
const spRoutes = require('./routes/spRoutes');
const partsRoutes = require('./routes/partsRoutes');
const sponsorsRoutes = require('./routes/sponsorsRoutes'); // ← IMPORTANTE: Agregar esta línea
const teamsRoutes = require('./routes/teamsRoutes');

const app = express();
const PORT = process.env.PORT;

// Middleware 
app.use(corsMiddleware);
app.use(express.json());

// ─────── PUBLIC ROUTES ───────
// Simple test route
app.get('/', (req, res) => {
  res.json({
    mssg: 'F1 Garage Manager API',
    status: 'Sync with MSSQL-Server',
    data_base: process.env.DB_NAME,
    server: process.env.DB_SERVER
  });
});

// DB test route
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
app.use('/api/test', testRoutes);
app.use('/api/sp', spRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/sponsors', sponsorsRoutes); // ← IMPORTANTE: Agregar esta línea
app.use('/api/teams', teamsRoutes);

// Init Server 
async function initServer() {
  try {
    // Start connection with mssql-server
    await mssqlConnect(); 
    
    // Init web server
    app.listen(PORT, () => {
      console.log(`[SUCCESS] (◪_◪)- http://localhost:${PORT}`);
      console.log('');
      console.log('Rutas disponibles:');
      console.log('  - GET  /');
      console.log('  - GET  /status');
      console.log('  - GET  /api/teams');
      console.log('  - GET  /api/parts');
      console.log('  - GET  /api/sponsors');
      console.log('  - GET  /api/sponsors/budget/:teamId'); // ← Nueva ruta importante
      console.log('');
    });
    
  } catch (error) {
    console.error('!ERROR: Web server could not be initialized:', error.message);
    process.exit(1);
  }
}

// Execute server
initServer();