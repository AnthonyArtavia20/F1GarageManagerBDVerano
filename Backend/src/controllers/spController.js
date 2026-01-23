const { mssqlConnect, sql } = require('../config/database');

// ========== FUNCIONES GENERALES PARA STORED PROCEDURES ==========

// Execute Stored Procedure (mantener esta función original)
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

// Get available Stored Procedures (mantener esta función original)
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

// ========== FUNCIONES ESPECÍFICAS PARA CAR ASSEMBLY (COMPATIBLES CON TU SP) ==========

// Obtener inventario del equipo - COMPATIBLE con INVENTORY_PART
exports.getTeamInventory = async (req, res) => {
  try {
    const { teamId } = req.params;
    console.log(`[INVENTORY] Getting inventory for team ${teamId}`);
    
    const pool = await mssqlConnect();
    
    // Obtener el Inventory_id primero
    const inventoryIdResult = await pool.request()
      .input('Team_id', sql.Int, teamId)
      .query('SELECT Inventory_id FROM INVENTORY WHERE Team_id = @Team_id');
    
    if (inventoryIdResult.recordset.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No inventory found for this team'
      });
    }
    
    const inventoryId = inventoryIdResult.recordset[0].Inventory_id;
    
    // Obtener partes del inventario usando INVENTORY_PART
    const result = await pool.request()
      .input('Inventory_id', sql.Int, inventoryId)
      .query(`
        SELECT 
          p.Part_id,
          p.Name,
          p.Category,
          p.Price,
          ip.Quantity as Stock,
          p.p, p.a, p.m
        FROM INVENTORY_PART ip
        JOIN PART p ON ip.Part_id = p.Part_id
        WHERE ip.Inventory_id = @Inventory_id
        AND ip.Quantity > 0
        ORDER BY p.Category, p.Name
      `);
    
    console.log(`[INVENTORY] Found ${result.recordset.length} parts`);
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en getTeamInventory:', error);
    
    // Fallback a query más simple
    try {
      console.log('[FALLBACK] Trying simplified query...');
      const pool = await mssqlConnect();
      
      const queryResult = await pool.request()
        .input('Team_id', sql.Int, req.params.teamId)
        .query(`
          SELECT 
            p.Part_id,
            p.Name,
            p.Category,
            p.Price,
            5 as Stock, -- Valor por defecto
            p.p, p.a, p.m
          FROM PART p
          WHERE p.Category IN ('Power_Unit', 'Aerodynamics_pkg', 'Wheels', 'Suspension', 'Gearbox')
          ORDER BY p.Category, p.Name
        `);
      
      console.log(`[FALLBACK] Using ${queryResult.recordset.length} default parts`);
      
      res.json({
        success: true,
        data: queryResult.recordset,
        source: 'default_parts'
      });
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError);
      res.status(500).json({ 
        success: false, 
        message: 'Error al obtener inventario', 
        error: error.message 
      });
    }
  }
};

// Obtener todos los equipos
exports.getAllTeams = async (req, res) => {
  try {
    const pool = await mssqlConnect();
    const result = await pool.request()
      .query('SELECT Team_id, Name FROM TEAM ORDER BY Name');
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en getAllTeams:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener equipos', 
      error: error.message 
    });
  }
};

// Buscar equipos
exports.searchTeams = async (req, res) => {
  try {
    const { search } = req.query;
    const pool = await mssqlConnect();
    
    const result = await pool.request()
      .input('search', sql.NVarChar(100), `%${search}%`)
      .query('SELECT Team_id, Name FROM TEAM WHERE Name LIKE @search ORDER BY Name');
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en searchTeams:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al buscar equipos', 
      error: error.message 
    });
  }
};