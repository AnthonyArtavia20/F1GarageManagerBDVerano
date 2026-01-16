const { mssqlConnect, sql } = require('../config/database');

// ========== GESTIÓN DE PATROCINADORES ==========

// Obtener todos los patrocinadores
exports.getAllSponsors = async (req, res) => {
  try {
    const pool = await mssqlConnect();
    
    const result = await pool.request()
      .query('SELECT * FROM SPONSOR ORDER BY Name');
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en getAllSponsors:', error);
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
    
    if (!Name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del patrocinador es obligatorio'
      });
    }

    const pool = await mssqlConnect();
    
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
    console.error('Error en createSponsor:', error);
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
    
    const result = await pool.request()
      .input('Team_id', sql.Int, parseInt(teamId))
      .execute('sp_GetTeamContributionsDetailed');
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error en getTeamContributions:', error);
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
    
    console.log('Datos recibidos para crear aporte:', { sponsorId, teamId, amount, description });
    
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
    
    // USAR STORED PROCEDURE 
    const result = await pool.request()
      .input('Sponsor_id', sql.Int, parseInt(sponsorId)) 
      .input('Team_id', sql.Int, parseInt(teamId))
      .input('Amount', sql.Decimal(10, 2), parseFloat(amount))
      .input('Description', sql.NVarChar(200), description || null)
      .output('NewBudget', sql.Decimal(10, 2))
      .execute('sp_RegisterContribution');
    
    console.log('Resultado del SP:', result);
    
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

// Obtener presupuesto actual de un equipo
exports.getTeamBudget = async (req, res) => {
  try {
    const { teamId } = req.params;
    
    console.log('Obteniendo presupuesto para equipo:', teamId);
    
    const pool = await mssqlConnect();
    
    // Usar sp_GetTeamBudget
    const result = await pool.request()
      .input('Team_id', sql.Int, parseInt(teamId))
      .execute('sp_GetTeamBudget');
    
    console.log('Resultado del SP sp_GetTeamBudget:', result.recordset);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipo no encontrado'
      });
    }

    const budgetData = result.recordset[0];
    
    // Construir respuesta con los datos correctos
    const response = {
      teamId: budgetData.Team_id,
      teamName: budgetData.Name,
      totalBudget: parseFloat(budgetData.Total_Budget) || 0,
      totalSpent: parseFloat(budgetData.Total_Spent) || 0,
      availableBudget: parseFloat(budgetData.Available_Budget) || 0,
      totalContributions: budgetData.Total_Contributions || 0,
      totalPurchases: budgetData.Total_Purchases || 0
    };
    
    console.log('Respuesta formateada:', response);
    
    res.json({
      success: true,
      data: response
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

// Obtener estadísticas de un sponsor
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
    console.error('Error en getSponsorStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del sponsor',
      error: error.message
    });
  }
};

// Recalcular presupuestos de todos los equipos
exports.recalculateAllBudgets = async (req, res) => {
  try {
    const pool = await mssqlConnect();
    
    // Ejecutar recalculo para cada equipo
    const teamsResult = await pool.request()
      .query('SELECT Team_id FROM TEAM');
    
    for (const team of teamsResult.recordset) {
      await pool.request()
        .input('Team_id', sql.Int, team.Team_id)
        .execute('sp_GetTeamBudget');
    }
    
    // Obtener todos los presupuestos actualizados
    const budgetsResult = await pool.request()
      .query(`
        SELECT 
          Team_id,
          Name,
          Total_Budget,
          Total_Spent,
          Total_Budget - Total_Spent AS Available_Budget
        FROM TEAM
        ORDER BY Team_id
      `);
    
    res.json({
      success: true,
      message: 'Presupuestos recalculados exitosamente',
      data: budgetsResult.recordset
    });
  } catch (error) {
    console.error('Error en recalculateAllBudgets:', error);
    res.status(500).json({
      success: false,
      message: 'Error al recalcular presupuestos',
      error: error.message
    });
  }
};