const express = require('express');
const { mssqlConnect } = require('./config/database');
const corsMiddleware = require('./middleware/corsMiddleware');

// Import Routes
const testRoutes = require('./routes/testRoutes');
const spRoutes = require('./routes/spRoutes');

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

// Init Server 
async function initServer() {
  try {
    // Start connection with mssql-server
    await mssqlConnect(); 
    
    // Init web server
    app.listen(PORT, () => {
      console.log(`[SUCCESS] (◪_◪)- http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('!ERROR: Web server could not be initialized:', error.message);
    process.exit(1);
  }
}

// Execute server
initServer();