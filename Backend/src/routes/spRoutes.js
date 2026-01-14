const express = require('express');
const router = express.Router();
const spController = require('../controllers/spController');

// GET - List Stored Procedures
router.get('/list', spController.getStoredProcedures);

// POST - Execute Stored Procedures
router.post('/execute', spController.executeStoredProcedure);

// ============================================================================
// MÓDULO ARMADO: Endpoints específicos
// ============================================================================

// POST - Instalar parte en auto
router.post('/install-part', async (req, res) => {
  try {
    const { carId, partId, teamId } = req.body;
    
    if (!carId || !partId || !teamId) {
      return res.status(400).json({ error: 'carId, partId, teamId requeridos' });
    }
    
    const pool = await require('../config/database').mssqlConnect();
    const result = await pool.request()
      .input('Car_id', require('../config/database').sql.Int, carId)
      .input('Part_id', require('../config/database').sql.Int, partId)
      .input('Team_id', require('../config/database').sql.Int, teamId)
      .execute('sp_InstallPart');
    
    res.json({ success: true, message: 'Parte instalada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Reemplazar parte en auto
router.post('/replace-part', async (req, res) => {
  try {
    const { carId, oldPartId, newPartId, teamId } = req.body;
    
    if (!carId || !oldPartId || !newPartId || !teamId) {
      return res.status(400).json({ error: 'carId, oldPartId, newPartId, teamId requeridos' });
    }
    
    const pool = await require('../config/database').mssqlConnect();
    const result = await pool.request()
      .input('Car_id', require('../config/database').sql.Int, carId)
      .input('OldPart_id', require('../config/database').sql.Int, oldPartId)
      .input('NewPart_id', require('../config/database').sql.Int, newPartId)
      .input('Team_id', require('../config/database').sql.Int, teamId)
      .execute('sp_ReplacePart');
    
    res.json({ success: true, message: 'Parte reemplazada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
