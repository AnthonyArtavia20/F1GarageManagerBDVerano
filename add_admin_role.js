const { mssqlConnect } = require('./Backend/src/config/database');
const mssql = require('mssql');

(async () => {
  try {
    const pool = await mssqlConnect();
    
    // Step 1: Find winAdmin
    const userResult = await pool.request()
      .input('username', mssql.VarChar, 'winAdmin')
      .query(`SELECT User_id FROM [USER] WHERE Username = @username`);
    
    if (userResult.recordset.length === 0) {
      console.error('❌ winAdmin user not found in USER table');
      process.exit(1);
    }
    
    const userId = userResult.recordset[0].User_id;
    console.log(`✅ Found winAdmin with User_id: ${userId}`);
    
    // Step 2: Check if already in ADMIN table
    const adminResult = await pool.request()
      .input('userId', mssql.Int, userId)
      .query(`SELECT User_id FROM ADMIN WHERE User_id = @userId`);
    
    if (adminResult.recordset.length > 0) {
      console.log(`✅ winAdmin is already in ADMIN table`);
    } else {
      // Step 3: Add to ADMIN table
      await pool.request()
        .input('userId', mssql.Int, userId)
        .query(`INSERT INTO ADMIN (User_id) VALUES (@userId)`);
      console.log(`✅ Added winAdmin to ADMIN table`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
