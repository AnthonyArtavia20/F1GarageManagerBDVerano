const sql = require('mssql');
require('dotenv').config();

// Verification of load 
// parameters for DB configuration
console.log('\n[LOG] MSSQL-SERVER CONFIG PARAM:', {
  DB_SERVER: process.env.DB_SERVER,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD ? '***' + process.env.DB_PASSWORD.slice(-3) : 'undefined'
});

// DB connection config
const mssqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: 'localhost',
  port: 1433,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 10,
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000
  }
};

// Function to connect with mssql-server (DB)
async function mssqlConnect() {
  try {
    console.log('\n[LOG] INIT CONNECTION WITH MSSQL-Server...');
    
    const pool = await sql.connect(mssqlConfig);
    
    // Test connection
    await pool.request().query('SELECT 1 as test');
    console.log('[LOG] (∿°○°)∿ SUCCESS!!!');
    
    // Get tables
    console.log('\n[LOG] AVAILABLE TABLES');
    console.log('───────────────────────');
    
    const query = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `;
    
    const result = await pool.request().query(query);
    
    if (result.recordset.length === 0) {
      console.log('NULL');
    } else {
      result.recordset.forEach((table, index) => {
        console.log(`${index + 1}. ${table.TABLE_NAME}`);
      });
      console.log(`\nTOTAL ${result.recordset.length}`);
    }
    
    console.log('───────────────────────\n');
    
    return pool;

  } catch (error) {

    console.error('!ERROR: Connection with mssql-server could not be established: ', error.message);
    throw error;
  }
}

module.exports = { mssqlConnect, sql };
