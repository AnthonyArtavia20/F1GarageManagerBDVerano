// backend/src/routes/partsRoutes.js
const express = require('express');
const router = express.Router();
const partsController = require('../controllers/partsController');

// ========== RUTAS DE PARTES ==========

// GET /api/parts - Obtener todas las partes
router.get('/', partsController.getAllParts);

// POST /api/parts - Crear nueva parte
router.post('/', partsController.createPart);

// GET /api/parts/:partId - Obtener parte por ID
router.get('/:partId', partsController.getPartById);

// PUT /api/parts/:partId - Actualizar parte
router.put('/:partId', partsController.updatePart);

// DELETE /api/parts/:partId - Eliminar parte
router.delete('/:partId', partsController.deletePart);

// POST /api/purchase - Purchase a Part for a Team
router.post('/purchase', partsController.purchasePart);

module.exports = router;
