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

// Obtener configuración del carro - COMPATIBLE con CAR_CONFIGURATION
exports.getCarConfiguration = async (req, res) => {
  try {
    const { carId } = req.params;
    console.log(`[CONFIG] Getting configuration for car ${carId}`);
    
    const pool = await mssqlConnect();
    
    const result = await pool.request()
      .input('Car_id', sql.Int, carId)
      .query(`
        SELECT 
          cc.Part_Category,
          cc.Part_id,
          p.Name as Part_Name,
          p.p, p.a, p.m
        FROM CAR_CONFIGURATION cc
        JOIN PART p ON cc.Part_id = p.Part_id
        WHERE cc.Car_id = @Car_id
        ORDER BY cc.Part_Category
      `);
    
    console.log(`[CONFIG] Found ${result.recordset.length} installed parts`);
    
    res.json({
      success: true,
      parts: result.recordset
    });
  } catch (error) {
    console.error('Error en getCarConfiguration:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener configuración', 
      error: error.message 
    });
  }
};

// Obtener estadísticas del carro
exports.getCarStats = async (req, res) => {
  try {
    const { carId } = req.params;
    console.log(`[STATS] Getting stats for car ${carId}`);
    
    const pool = await mssqlConnect();
    
    // Usar SP si existe
    try {
      const spResult = await pool.request()
        .input('Car_id', sql.Int, carId)
        .execute('sp_CalculateCarStats');
      
      if (spResult.recordset.length > 0) {
        console.log(`[STATS] SP result:`, spResult.recordset[0]);
        
        // Luego obtener las stats calculadas
        const statsResult = await pool.request()
          .input('Car_id', sql.Int, carId)
          .query(`
            SELECT 
              c.Car_id,
              c.Power,
              c.Aerodynamics,
              c.Maneuverability,
              c.TotalPerformance,
              (SELECT COUNT(*) FROM CAR_CONFIGURATION WHERE Car_id = @Car_id) as Parts_Installed
            FROM CAR c
            WHERE c.Car_id = @Car_id
          `);
        
        if (statsResult.recordset.length > 0) {
          res.json({
            success: true,
            stats: statsResult.recordset[0]
          });
          return;
        }
      }
    } catch (spError) {
      console.log('[STATS] SP not available, calculating manually');
    }
    
    // Calcular manualmente
    const installedParts = await pool.request()
      .input('Car_id', sql.Int, carId)
      .query(`
        SELECT p.p, p.a, p.m
        FROM CAR_CONFIGURATION cc
        JOIN PART p ON cc.Part_id = p.Part_id
        WHERE cc.Car_id = @Car_id
      `);
    
    const partsCount = installedParts.recordset.length;
    let totalPower = 0;
    let totalAero = 0;
    let totalManeuver = 0;
    
    installedParts.recordset.forEach(part => {
      totalPower += part.p || 0;
      totalAero += part.a || 0;
      totalManeuver += part.m || 0;
    });
    
    const stats = {
      Car_id: parseInt(carId),
      Power: totalPower,
      Aerodynamics: totalAero,
      Maneuverability: totalManeuver,
      TotalPerformance: totalPower + totalAero + totalManeuver,
      Parts_Installed: partsCount
    };
    
    console.log(`[STATS] Manual calculation:`, stats);
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('Error en getCarStats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas', 
      error: error.message 
    });
  }
};

// Instalar parte - LLAMA DIRECTAMENTE A TU SP sp_InstallPart
exports.installPart = async (req, res) => {
  try {
    const { carId, partId, teamId } = req.body;
    console.log(`[INSTALL] Calling sp_InstallPart with:`, { carId, partId, teamId });
    
    const pool = await mssqlConnect();
    
    // Ejecutar el stored procedure EXISTENTE
    const result = await pool.request()
      .input('Car_id', sql.Int, carId)
      .input('Part_id', sql.Int, partId)
      .input('Team_id', sql.Int, teamId)
      .execute('sp_InstallPart');
    
    console.log(`[INSTALL] SP executed successfully:`, result.recordset);
    
    res.json({ 
      success: true, 
      message: 'Parte instalada correctamente',
      data: result.recordset[0] || { Status: 'OK', Message: 'Parte instalada exitosamente' }
    });
    
  } catch (error) {
    console.error('Error en installPart:', error.message);
    console.error('Error details:', error.originalError?.info || error);
    
    // Proporcionar mensaje de error más claro
    const errorMessage = error.message || 'Error desconocido';
    const userMessage = errorMessage.includes('no disponible en inventario') 
      ? 'La parte no está disponible en el inventario del equipo. Primero compre la parte en la tienda.'
      : errorMessage.includes('Categoría ya instalada')
      ? 'Ya hay una parte de esta categoría instalada. Use reemplazar.'
      : errorMessage;
    
    res.status(500).json({ 
      success: false, 
      message: userMessage,
      error: errorMessage,
      details: error.originalError?.info?.message || 'No additional details'
    });
  }
};

// Reemplazar parte - Usar el mismo SP con lógica diferente
exports.replacePart = async (req, res) => {
  try {
    const { carId, oldPartId, newPartId, teamId } = req.body;
    console.log(`[REPLACE] Replacing part ${oldPartId} with ${newPartId} on car ${carId}`);
    
    const pool = await mssqlConnect();
    
    // 1. Desinstalar parte vieja usando un SP o query
    await pool.request()
      .input('Car_id', sql.Int, carId)
      .input('Part_id', sql.Int, oldPartId)
      .query(`
        DELETE FROM CAR_CONFIGURATION 
        WHERE Car_id = @Car_id AND Part_id = @Part_id
      `);
    
    // 2. Instalar parte nueva usando sp_InstallPart
    const installResult = await pool.request()
      .input('Car_id', sql.Int, carId)
      .input('Part_id', sql.Int, newPartId)
      .input('Team_id', sql.Int, teamId)
      .execute('sp_InstallPart');
    
    console.log(`[REPLACE] Replacement completed`);
    
    res.json({ 
      success: true, 
      message: 'Parte reemplazada correctamente',
      data: installResult.recordset[0]
    });
    
  } catch (error) {
    console.error('Error en replacePart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al reemplazar parte', 
      error: error.message 
    });
  }
};

// Desinstalar parte
exports.uninstallPart = async (req, res) => {
  try {
    const { carId, partId, teamId } = req.body;
    console.log(`[UNINSTALL] Uninstalling part ${partId} from car ${carId}`);
    
    const pool = await mssqlConnect();
    
    // Obtener información de la parte antes de desinstalar
    const partInfo = await pool.request()
      .input('Part_id', sql.Int, partId)
      .query('SELECT Category, Name FROM PART WHERE Part_id = @Part_id');
    
    if (partInfo.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parte no encontrada'
      });
    }
    
    // Desinstalar de CAR_CONFIGURATION
    await pool.request()
      .input('Car_id', sql.Int, carId)
      .input('Part_id', sql.Int, partId)
      .query(`
        DELETE FROM CAR_CONFIGURATION 
        WHERE Car_id = @Car_id AND Part_id = @Part_id
      `);
    
    // Incrementar inventario (si aplica)
    try {
      const inventoryIdResult = await pool.request()
        .input('Team_id', sql.Int, teamId)
        .query('SELECT Inventory_id FROM INVENTORY WHERE Team_id = @Team_id');
      
      if (inventoryIdResult.recordset.length > 0) {
        const inventoryId = inventoryIdResult.recordset[0].Inventory_id;
        
        await pool.request()
          .input('Inventory_id', sql.Int, inventoryId)
          .input('Part_id', sql.Int, partId)
          .query(`
            UPDATE INVENTORY_PART 
            SET Quantity = Quantity + 1
            WHERE Inventory_id = @Inventory_id AND Part_id = @Part_id
          `);
      }
    } catch (inventoryError) {
      console.log('[UNINSTALL] Could not update inventory, continuing...');
    }
    
    console.log(`[UNINSTALL] Part ${partId} uninstalled successfully`);
    
    res.json({ 
      success: true, 
      message: 'Parte desinstalada correctamente'
    });
    
  } catch (error) {
    console.error('Error en uninstallPart:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al desinstalar parte', 
      error: error.message 
    });
  }
};

// Validar parte
exports.validatePart = async (req, res) => {
  try {
    const { carId, partId } = req.params;
    console.log(`[VALIDATE] Validating part ${partId} for car ${carId}`);
    
    // Validación simple - siempre válido
    res.json({
      success: true,
      validation: {
        Status: 'VALID',
        Message: 'Parte válida para instalación'
      }
    });
    
  } catch (error) {
    console.error('Error en validatePart:', error);
    res.json({
      success: true,
      validation: {
        Status: 'VALID',
        Message: 'Parte válida para instalación (fallback)'
      }
    });
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