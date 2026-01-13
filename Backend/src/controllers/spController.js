const { mssqlConnect, sql } = require('../config/database');

// Execute Stored Procedure
exports.executeStoredProcedure = async (req, res) => {
  try {
    const { procedureName, parameters = {} } = req.body;
    
    if (!procedureName) {
      return res.status(400).json({
        success: false,
        message: 'Procedure name is required'
      });
    }
    
    console.log(`\n[LOG] Executing stored procedure: ${procedureName}`);
    console.log('Parameters:', parameters);
    
    const pool = await mssqlConnect();
    const request = pool.request();
    
    // Parameters iteration
    Object.keys(parameters).forEach(key => {
      request.input(key, parameters[key]);
    });
    
    const result = await request.execute(procedureName);
    
    res.json({
      success: true,
      message: `Stored procedure '${procedureName}' executed successfully`,
      procedure: procedureName,
      parameters: parameters,
      records: result.recordset.length,
      data: result.recordset,
      output: result.output,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error(`!ERROR: Executing stored procedure:`, error.message);
    res.status(500).json({
      success: false,
      message: `Error executing stored procedure`,
      error: error.message,
      details: error.originalError?.info?.message || 'No additional details'
    });
  }
};

// Get available Stored Procedures 
exports.getStoredProcedures = async (req, res) => {
  try {
    const pool = await mssqlConnect();
    
    const query = `
      SELECT 
        SPECIFIC_NAME as procedureName,
        SPECIFIC_SCHEMA as schemaName,
        CREATED as createdDate,
        LAST_ALTERED as lastModified
      FROM INFORMATION_SCHEMA.ROUTINES
      WHERE ROUTINE_TYPE = 'PROCEDURE'
      ORDER BY SPECIFIC_SCHEMA, SPECIFIC_NAME
    `;
    
    const result = await pool.request().query(query);
    
    res.json({
      success: true,
      message: 'Stored procedures retrieved successfully',
      count: result.recordset.length,
      procedures: result.recordset,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('!ERROR: getting stored procedures:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error: Retrieving stored procedures',
      error: error.message
    });
  }
};
