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
const circuitsRoutes = require('./routes/circuitsRoutes');
const simulationsRoutes = require('./routes/simulationsRoutes');
const driversRoutes = require('./routes/driversRoutes');

const carAssemblyRoutes = require('./routes/modules/CarAssembly');

const app = express();
const PORT = process.env.PORT || 9090;

// ===== MIDDLEWARE EN ORDEN CORRECTO =====

// 1. CORS primero
app.use(corsMiddleware);

// 2. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Session (CONFIGURACIÓN SIMPLIFICADA PARA DEV)
app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret_f1_garage_2024",
  resave: true,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000,
  },
  name: 'f1garage.sid',
}));

// 4. Middleware de debug
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log(`  Origin: ${req.headers.origin || 'none'}`);
    console.log(`  Session ID: ${req.sessionID}`);
    console.log(`  Has User: ${!!req.session.user}`);
  }
  next();
});

// ===== RUTAS PÚBLICAS =====

app.get('/', (req, res) => {
  res.json({
    message: 'F1 Garage Manager API',
    status: 'Online',
    database: process.env.DB_NAME,
    server: process.env.DB_SERVER,
    sessionEnabled: true,
    routes: {
      carAssembly: '/api/sp', // Documenta la nueva ruta
      teams: '/api/teams',
      inventory: '/api/inventory',
      // ... otras rutas
    }
  });
});

app.get('/status', async (req, res) => {
  try {
    const pool = await mssqlConnect();
    const result = await pool.request().query('SELECT @@VERSION as version');

    res.json({
      status: 'online',
      database: process.env.DB_NAME,
      sqlVersion: result.recordset[0].version.split('\n')[0],
      timestamp: new Date().toISOString(),
      sessionTest: {
        sessionID: req.sessionID,
        hasSession: !!req.session.id
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ===== RUTAS DE API =====
// ⚠️ ORDEN CRÍTICO: CarAssembly DEBE estar ANTES que spRoutes

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);

// CarAssembly PRIMERO (rutas específicas)
app.use('/api/sp/assembly', carAssemblyRoutes);

// spRoutes DESPUÉS (rutas generales)
app.use('/api/sp', spRoutes);  // <-- Mantiene /api/sp/teams

// TERCERO: Otras rutas
app.use('/api/parts', partsRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/drivers', driversRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/circuits', circuitsRoutes);
app.use('/api/simulations', simulationsRoutes);

// ===== MANEJO DE ERRORES =====

// 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error del servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ===== INICIALIZACIÓN DEL SERVIDOR =====

async function initServer() {
  try {
    await mssqlConnect();
    console.log('✅ Conexión a SQL Server establecida');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 ===== SERVIDOR INICIADO =====');
      console.log(`✅ Backend API: http://localhost:${PORT}`);
      console.log(`🌐 Acceso desde red: http://${getLocalIP()}:${PORT}`);
      console.log(`📡 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log('📊 Rutas activas:');
      console.log('  • /api/auth - Autenticación');
      console.log('  • /api/sp - Armado de autos (CarAssembly)');
      console.log('  • /api/general - Stored Procedures generales');
      console.log('  • /api/teams - Equipos');
      console.log('  • /api/inventory - Inventario');
      console.log('  • /api/parts - Partes');
      console.log('  • /api/sponsors - Sponsors');
      console.log('  • /api/simulations - Simulaciones de carreras');
      console.log('================================\n');
    });

  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error.message);
    process.exit(1);
  }
}

// Función para obtener IP local
function getLocalIP() {
  try {
    const interfaces = require('os').networkInterfaces();
    for (const interfaceName in interfaces) {
      for (const iface of interfaces[interfaceName]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (err) {
    console.warn('⚠ No se pudo obtener IP local:', err.message);
  }
  return 'localhost';
}

// Iniciar servidor
initServer();