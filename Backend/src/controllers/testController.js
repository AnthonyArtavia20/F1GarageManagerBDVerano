const { mssqlConnect } = require('../config/database');

// Test system connection 
exports.testConnection = async (req, res) => {
  try {
    const pool = await mssqlConnect();
    const result = await pool.request().query('SELECT 1 as connected');
    
    res.json({
      success: true,
      message: 'Succesful Connection with MSSQL-SERVER',
      database: process.env.DB_NAME,
      server: process.env.DB_SERVER,
      connected: true
    });
    
  } catch (error) {
    console.error('Error testConnection:', error.message);
    res.status(500).json({
      success: false,
      message: '!ERROR with MSSQL sync',
      error: error.message
    });
  }
};

// Test simple API
exports.testAPI = async (req, res) => {
  try {
    const { testData } = req.body;
    
    console.log('\n[MSSG] Frontend >>', testData);
    
    res.json({
      success: true,
      message: 'API working...',
      received: testData,
      timestamp: new Date().toISOString(),
      endpoint: '/api/test/api'
    });
    
  } catch (error) {
    console.error('Error testAPI:', error.message);
    res.status(500).json({
      success: false,
      message: '!ERROR on Server Connection',
      error: error.message
    });
  }
};

// Test All
exports.testAll = async (req, res) => {
  try {
    // Test connection with DB
    const pool = await mssqlConnect();
    await pool.request().query('SELECT 1 as test');
    
    // Test API
    const { testData } = req.body;
    
    res.json({
      success: true,
      message: 'All Connections were Tested',
      tests: {
        database: 'Connection On',
        api: 'API Sync',
        frontend: testData ? 'Data recived ' : 'None Data was reccived'
      },
      data: testData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error testAll:', error.message);
    res.status(500).json({
      success: false,
      message: '!ERROR in connection',
      error: error.message
    });
  }
};
