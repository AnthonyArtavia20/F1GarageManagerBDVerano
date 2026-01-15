const { mssqlConnect, sql } = require('../config/database');

// ========== GESTIÓN DE PATROCINADORES ==========

// Obtener todos los patrocinadores
exports.getAllSponsors = async (req, res) => {
  try {
    const pool = await mssqlConnect();
    
    // Query directa 
    const result = await pool.request()
      .query('SELECT * FROM SPONSOR ORDER BY Name');
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener patrocinadores',
      error: error.message
    });
  }
};

// Crear un nuevo patrocinador
exports.createSponsor = async (req, res) => {
  try {
    const { Name, Industry, Country } = req.body;
    
    // Validación básica
    if (!Name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del patrocinador es obligatorio'
      });
    }

    const pool = await mssqlConnect();
    
    // Query directa 
    const result = await pool.request()
      .input('Name', sql.NVarChar(100), Name)
      .input('Industry', sql.NVarChar(100), Industry || null)
      .input('Country', sql.NVarChar(50), Country || null)
      .query(`
        INSERT INTO SPONSOR (Name, Industry, Country)
        OUTPUT INSERTED.*
        VALUES (@Name, @Industry, @Country)
      `);
    
    res.status(201).json({
      success: true,
      message: 'Patrocinador creado exitosamente',
      data: result.recordset[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear patrocinador',
      error: error.message
    });
  }
};

// ========== GESTIÓN DE APORTES ==========

// Obtener aportes de un equipo
exports.getTeamContributions = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const pool = await mssqlConnect();
    
    // Usar stored procedure
    const result = await pool.request()
      .input('Team_id', sql.Int, parseInt(teamId))
      .execute('sp_GetTeamContributionsDetailed');
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener aportes',
      error: error.message
    });
  }
};

// Registrar un nuevo aporte 
exports.createContribution = async (req, res) => {
  try {
    const { sponsorId, teamId, amount, description } = req.body;
    
    // Validaciones
    if (!sponsorId || !teamId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Sponsor, equipo y monto son obligatorios'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    const pool = await mssqlConnect();
    
    // ✅ USAR STORED PROCEDURE ACTUALIZADO
    const result = await pool.request()
      .input('Sponsor_id', sql.Int, parseInt(sponsorId)) 
      .input('Team_id', sql.Int, parseInt(teamId))
      .input('Amount', sql.Decimal(10, 2), parseFloat(amount))
      .input('Description', sql.NVarChar(200), description || null)
      .output('NewBudget', sql.Decimal(10, 2))
      .execute('sp_RegisterContribution');
    
    res.status(201).json({
      success: true,
      message: 'Aporte registrado exitosamente',
      data: {
        contributionId: result.recordset[0]?.Contribution_id,
        newBudget: result.output.NewBudget
      }
    });
  } catch (error) {
    console.error('Error en createContribution:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar aporte',
      error: error.message
    });
  }
};

// ========== CÁLCULO DE PRESUPUESTO ==========

// ✅ ACTUALIZADO: Obtener presupuesto actual de un equipo
// Ahora usa el SP actualizado que lee directamente de TEAM
exports.getTeamBudget = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    const pool = await mssqlConnect();
    
    // Usar sp_GetTeamBudget actualizado
    const result = await pool.request()
      .input('Team_id', sql.Int, parseInt(teamId))
      .execute('sp_GetTeamBudget');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    const budgetData = result.recordset[0];
    
    res.json({
      success: true,
      data: {
        teamId: budgetData.Team_id,
        teamName: budgetData.Name,
        totalBudget: budgetData.Total_Budget,
        totalSpent: budgetData.Total_Spent,
        availableBudget: budgetData.Available_Budget,
        totalContributions: budgetData.Total_Contributions,
        totalPurchases: budgetData.Total_Purchases
      }
    });
  } catch (error) {
    console.error('Error en getTeamBudget:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener presupuesto',
      error: error.message
    });
  }
};

// ========== FUNCIONES ADICIONALES ==========

// ✅ NUEVO: Obtener estadísticas de un sponsor
exports.getSponsorStats = async (req, res) => {
  try {
    const { sponsorId } = req.params;
    
    const pool = await mssqlConnect();
    
    const result = await pool.request()
      .input('Sponsor_id', sql.Int, parseInt(sponsorId))
      .execute('sp_GetSponsorStats');
    
    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del sponsor',
      error: error.message
    });
  }
};

// ✅ NUEVO: Recalcular presupuestos de todos los equipos
// Útil para sincronizar datos después de actualizaciones
exports.recalculateAllBudgets = async (req, res) => {
  try {
    const pool = await mssqlConnect();
    
    const result = await pool.request()
      .execute('sp_RecalculateAllTeamBudgets');
    
    res.json({
      success: true,
      message: 'Presupuestos recalculados exitosamente',
      data: result.recordset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al recalcular presupuestos',
      error: error.message
    });
  }
};