const { mssqlConnect } = require('../config/database');

// Test de conexión simple
exports.testConnection = async (req, res) => {
  try {
    const pool = await mssqlConnect();
    const result = await pool.request().query('SELECT 1 as connected');
    
    res.json({
      success: true,
      message: '✅ Conexión a MSSQL exitosa',
      database: process.env.DB_NAME,
      server: process.env.DB_SERVER,
      connected: true
    });
    
  } catch (error) {
    console.error('Error testConnection:', error.message);
    res.status(500).json({
      success: false,
      message: '❌ Error de conexión a la base de datos',
      error: error.message
    });
  }
};

// Test de API simple
exports.testAPI = async (req, res) => {
  try {
    const { testData } = req.body;
    
    console.log('Test recibido del frontend:', testData);
    
    res.json({
      success: true,
      message: '✅ API funcionando correctamente',
      received: testData,
      timestamp: new Date().toISOString(),
      endpoint: '/api/test/api'
    });
    
  } catch (error) {
    console.error('Error testAPI:', error.message);
    res.status(500).json({
      success: false,
      message: '❌ Error en el servidor',
      error: error.message
    });
  }
};

// Test completo
exports.testAll = async (req, res) => {
  try {
    // Test de conexión a BD
    const pool = await mssqlConnect();
    await pool.request().query('SELECT 1 as test');
    
    // Test de API
    const { testData } = req.body;
    
    res.json({
      success: true,
      message: '✅ Todas las conexiones funcionan',
      tests: {
        database: '✅ Conectado',
        api: '✅ Funcionando',
        frontend: testData ? '✅ Datos recibidos' : '⚠️ Sin datos'
      },
      data: testData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error testAll:', error.message);
    res.status(500).json({
      success: false,
      message: '❌ Error en alguna conexión',
      error: error.message
    });
  }
};
