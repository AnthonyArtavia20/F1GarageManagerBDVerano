// routes/simulationsRoutes.js
const express = require('express');
const router = express.Router();
const simulationsController = require('../controllers/simulationsController');
const { mssqlConnect, sql } = require('../config/database');

// ============================================================================
// RUTAS DE SIMULACIONES
// ============================================================================

// GET - Obtener historial de simulaciones
router.get('/', simulationsController.getSimulationHistory);

// GET - Obtener carros disponibles para simulación
router.get('/available-cars', simulationsController.getAvailableCars);

// GET - Obtener circuito por ID para simulación
router.get('/circuits/:id', simulationsController.getCircuitForSimulation);

// GET - Obtener resultados de simulación específica
router.get('/:id', simulationsController.getSimulationResults);

// GET - Validar carro para simulación
router.get('/validate-car/:carId', simulationsController.validateCar);

// GET - Estadísticas por circuito
router.get('/circuit/:id/stats', simulationsController.getCircuitStatistics);

// POST - Ejecutar nueva simulación
router.post('/', simulationsController.runSimulation);

// DELETE - Eliminar simulación
router.delete('/:id', simulationsController.deleteSimulation);

// Nueva ruta para obtener conductores por equipo
router.get('/teams/:teamId/drivers', async (req, res) => {
  try {
    const { teamId } = req.params;
    const pool = await mssqlConnect();
    
    const result = await pool.request()
      .input('Team_id', sql.Int, teamId)
      .execute('sp_GetDriversByTeam');
    
    res.json({
      success: true,
      data: result.recordset
    });
  } catch (error) {
    console.error('Error al obtener conductores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conductores',
      error: error.message
    });
  }
});

module.exports = router;